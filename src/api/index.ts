import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { LIVE_BASE_URI, MOCK_BASE_URI } from "./baseUri";
import { isJwtExpired } from "@/lib/jwt";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/store/useAdminStore";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AppError,
} from "@/type/api";
import type { TokenResponse } from "@/type/auth";

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

export const REFRESH_PATH = "/admin/auth/refresh";

/**
 * 인증 없이 부를 수 있는 경로. 이 경로의 401은 화면이 직접 문구로 처리한다.
 *
 * 재발급도 여기 있다. 재발급이 401로 끝났다는 것은 세션이 정말 끝났다는 뜻이라
 * **다시 재발급을 시도하면 안 된다.** 아래 재시도 로직이 이 목록을 보고 멈춘다.
 */
const PUBLIC_PATHS = ["/admin/auth/login", REFRESH_PATH, "/admin/auth/logout"];

const isPublicPath = (url?: string) =>
  Boolean(url && PUBLIC_PATHS.some((path) => url.startsWith(path)));

/**
 * 세션이 끊긴 것을 알리고 로그인 화면으로 보냅니다.
 *
 * 화면마다 401을 처리하면 어떤 화면은 빈 표를, 어떤 화면은 에러 문구를 띄운다.
 * 만료는 화면의 문제가 아니라 세션의 문제이므로 여기서 한 번만 처리합니다.
 */
export const handleUnauthorized = () => {
  clearSession();

  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;

  const redirect = `${window.location.pathname}${window.location.search}`;

  window.location.replace(
    `${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}&reason=expired`,
  );
};

/**
 * 만료가 확실해 보내지 않은 요청의 실패값.
 *
 * 화면은 이 뒤에 곧 로그인 화면으로 넘어가지만, 그 사이에도 에러 객체의 모양은
 * 다른 실패와 같아야 한다. 화면마다 `error.code` 를 옵셔널로 다루게 만들지 않는다.
 */
const SESSION_EXPIRED_CODE = "SESSION_EXPIRED";

const sessionExpiredError = () => {
  const appError: AppError = {
    code: SESSION_EXPIRED_CODE,
    fields: {},
    message: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  };

  return Object.assign(new Error(appError.message), appError);
};

/**
 * 지금 진행 중인 재발급.
 *
 * 콘솔은 화면 하나가 조회를 여러 개 동시에 던진다. 토큰이 만료되면 그 요청들이
 * **한꺼번에** 401로 돌아오는데, 각자 재발급을 부르면 서버가 회전(rotation)을
 * 하므로 첫 번째만 성공하고 나머지는 이미 폐기된 토큰을 내밀어 로그아웃된다.
 * 그래서 재발급은 한 번만 돌리고 나머지는 그 약속을 함께 기다린다.
 */
let refreshPromise: Promise<string> | null = null;

/** 재발급 자체는 인터셉터가 없는 인스턴스로 부른다. 여기서 401이 나면 그대로 끝이다. */
const refreshAxios = axios.create({
  baseURL: LIVE_BASE_URI,
  headers: { "Content-Type": "application/json" },
});

/** 새 accessToken을 돌려준다. 실패하면 세션이 끝난 것이다. */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) throw new Error("no refresh token");

  const response = await refreshAxios.post<TokenResponse>(REFRESH_PATH, {
    refreshToken,
  });

  const tokens = unwrapApiData(response.data);

  setTokens(tokens);

  return tokens.accessToken;
};

/** 이미 돌고 있으면 그 약속을 그대로 준다. */
const requestRefresh = (): Promise<string> => {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/** 한 요청에 재시도는 한 번만. 무한 루프를 막는다. */
type RetriableConfig = InternalAxiosRequestConfig & { _isRetry?: boolean };

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
  const onRequest = async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    let accessToken = resolveAccessToken();

    /*
      죽은 것이 확실한 토큰은 보내지 않는다.

      exp 는 서명을 보지 않고 읽은 값이라 **무엇을 허용할지는 여기서 정하지
      않는다.** 다만 이미 지난 시각이면 서버도 401 로 답할 것이 확실하므로,
      그 왕복 한 번을 아끼고 곧장 재발급하거나 로그인 화면으로 보낸다.
      exp 를 읽을 수 없으면 아무것도 하지 않고 서버 판정에 맡긴다.
    */
    if (expiresSessionOn401 && !isPublicPath(config.url)) {
      if (isJwtExpired(getRefreshToken())) {
        /* 재발급 토큰까지 죽었으면 살려 낼 방법이 없다. 요청을 만들지 않는다. */
        handleUnauthorized();

        throw sessionExpiredError();
      }

      if (isJwtExpired(accessToken)) {
        try {
          accessToken = await requestRefresh();
        } catch {
          handleUnauthorized();

          throw sessionExpiredError();
        }
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  };

  /**
   * 401이면 먼저 재발급을 시도하고, 그래도 안 되면 세션을 끝냅니다.
   *
   * 화면에서 그대로 노출할 수 있는 에러 객체로 정규화하는 것도 여기서 합니다.
   */
  const onResponseError = async (error: AxiosError<ApiErrorResponse>) => {
    /* 요청 인터셉터가 만료로 끊은 것. 이미 로그인 화면으로 보냈으므로 그대로 넘긴다. */
    if ((error as unknown as AppError).code === SESSION_EXPIRED_CODE) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableConfig | undefined;

    const canRetry =
      expiresSessionOn401 &&
      error.response?.status === 401 &&
      Boolean(config) &&
      !config?._isRetry &&
      !isPublicPath(config?.url);

    if (canRetry && config) {
      try {
        const accessToken = await requestRefresh();

        config._isRetry = true;
        config.headers.Authorization = `Bearer ${accessToken}`;

        return await instance.request(config);
      } catch {
        /* 재발급이 실패하면 세션이 정말 끝난 것이다. 아래에서 로그인으로 보낸다. */
        handleUnauthorized();
      }
    } else if (
      expiresSessionOn401 &&
      error.response?.status === 401 &&
      !isPublicPath(config?.url)
    ) {
      handleUnauthorized();
    }

    const appError: AppError = {
      code: error.response?.data?.code ?? "UNKNOWN",
      fields: error.response?.data?.fields ?? {},
      message: error.response?.data?.message ?? "요청 처리에 실패했습니다.",
    };

    return Promise.reject(Object.assign(new Error(appError.message), appError));
  };

  instance.interceptors.request.use(onRequest);
  instance.interceptors.response.use(onResponseSuccess, onResponseError);

  return instance;
};

export const adminAxios: AxiosInstance = createAdminAxios({
  baseURL: MOCK_BASE_URI,
  resolveAccessToken: getAccessToken,
  expiresSessionOn401: true,
});

/**
 * 실서버에 붙는 인스턴스. **연동이 끝난 도메인만** 이것을 쓴다.
 *
 * 세션의 출처가 여기다 — 로그인 · 관리자 계정 · 직책이 이 인스턴스로 나간다.
 * 그래서 목업 구간이어도 401은 진짜 세션 만료다. 목업만 켜 두고 무시하면
 * 토큰이 죽은 채로 화면이 계속 그려지고, 조회는 전부 조용히 비어 보인다.
 */
export const liveAxios: AxiosInstance = createAdminAxios({
  baseURL: LIVE_BASE_URI,
  resolveAccessToken: getAccessToken,
  expiresSessionOn401: true,
});
