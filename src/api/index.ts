import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { clearSession, getAccessToken } from "@/store/useAdminStore";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AppError,
} from "@/type/api";

const IS_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * 실서버(plat-be `plat-admin`, 기본 8081) 베이스 URI.
 *
 * 목업 베이스와 **오리진을 다르게 둔다.** MSW 핸들러는 목업 베이스 URI로
 * 등록되어 있으므로, 오리진이 다르면 목업 구간을 켠 채로 연동이 끝난 도메인만
 * 실서버에 보낼 수 있다(`onUnhandledRequest: "bypass"`).
 */
const LIVE_BASE_URI =
  process.env.NEXT_PUBLIC_LIVE_BASE_URI ?? process.env.NEXT_PUBLIC_BASE_URI;

/**
 * 개발용 실서버 토큰.
 *
 * 관리자 서버에는 로그인 엔드포인트가 없다 — 토큰은 서비스 서버가 발급하고
 * 관리자 서버는 검증만 한다(`hasRole(ADMIN)`). 관리자 로그인이 실연동될 때까지는
 * 서비스 서버에서 받은 ADMIN 토큰을 `.env.local`에 두고 쓴다.
 */
const LIVE_ACCESS_TOKEN = process.env.NEXT_PUBLIC_LIVE_ACCESS_TOKEN;

/** 기존 공통 응답 봉투만 골라내는 가드입니다. */
const isLegacyApiSuccessEnvelope = <T>(
  responseData: ApiSuccessResponse<T>,
): responseData is { data: T; result?: "OK" } =>
  Boolean(
    responseData &&
      typeof responseData === "object" &&
      "result" in responseData &&
      responseData.result === "OK" &&
      "data" in responseData,
  );

/** 신규 DTO 응답과 기존 { result: "OK", data } 봉투 응답을 함께 해석합니다. */
export const unwrapApiData = <T>(responseData: ApiSuccessResponse<T>): T => {
  if (isLegacyApiSuccessEnvelope(responseData)) return responseData.data;

  return responseData as T;
};

/** 응답 data를 API 함수들이 바로 사용할 DTO 형태로 정규화합니다. */
const onResponseSuccess = (response: AxiosResponse): AxiosResponse => {
  response.data = unwrapApiData(response.data);

  return response;
};

export const LOGIN_PATH = "/login";

/** 인증 없이 부를 수 있는 경로. 이 경로의 401은 화면이 직접 문구로 처리한다. */
const PUBLIC_PATHS = ["/admin/auth/login"];

const isPublicPath = (url?: string) =>
  Boolean(url && PUBLIC_PATHS.some((path) => url.startsWith(path)));

/**
 * 세션이 끊긴 것을 알리고 로그인 화면으로 보냅니다.
 *
 * 화면마다 401을 처리하면 어떤 화면은 빈 표를, 어떤 화면은 에러 문구를 띄운다.
 * 만료는 화면의 문제가 아니라 세션의 문제이므로 여기서 한 번만 처리합니다.
 */
const handleUnauthorized = () => {
  clearSession();

  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;

  const redirect = `${window.location.pathname}${window.location.search}`;

  window.location.replace(
    `${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}&reason=expired`,
  );
};

interface CreateAdminAxiosOptions {
  baseURL?: string;
  /** 요청에 실을 토큰. */
  resolveAccessToken: () => string | null | undefined;
  /** 401을 세션 만료로 보고 로그인 화면으로 보낼지. */
  expiresSessionOn401: boolean;
}

const createAdminAxios = ({
  baseURL,
  resolveAccessToken,
  expiresSessionOn401,
}: CreateAdminAxiosOptions): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  /** 요청 인터셉터. 세션 토큰을 실어 보냅니다. */
  const onRequest = (
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig => {
    const accessToken = resolveAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  };

  /** 화면에서 그대로 노출할 수 있는 에러 객체로 정규화합니다. */
  const onResponseError = (error: AxiosError<ApiErrorResponse>) => {
    const appError: AppError = {
      code: error.response?.data?.code ?? "UNKNOWN",
      fields: error.response?.data?.fields ?? {},
      message: error.response?.data?.message ?? "요청 처리에 실패했습니다.",
    };

    if (
      expiresSessionOn401 &&
      error.response?.status === 401 &&
      !isPublicPath(error.config?.url)
    ) {
      handleUnauthorized();
    }

    return Promise.reject(Object.assign(new Error(appError.message), appError));
  };

  instance.interceptors.request.use(onRequest);
  instance.interceptors.response.use(onResponseSuccess, onResponseError);

  return instance;
};

export const adminAxios: AxiosInstance = createAdminAxios({
  baseURL: process.env.NEXT_PUBLIC_BASE_URI,
  resolveAccessToken: getAccessToken,
  expiresSessionOn401: true,
});

/**
 * 실서버에 붙는 인스턴스. **연동이 끝난 도메인만** 이것을 쓴다.
 *
 * 목업 로그인 세션과 실서버 토큰은 별개다. 목업 구간에서 실서버 401로 세션을
 * 끊으면 토큰을 잘못 넣은 것만으로 콘솔 전체에서 로그인 화면으로 튕긴다.
 */
export const liveAxios: AxiosInstance = createAdminAxios({
  baseURL: LIVE_BASE_URI,
  resolveAccessToken: () => LIVE_ACCESS_TOKEN || getAccessToken(),
  expiresSessionOn401: !IS_MOCKING,
});
