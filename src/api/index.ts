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

const BASE_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_BASE_URI,
  headers: { "Content-Type": "application/json" },
};

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

/** 화면에서 그대로 노출할 수 있는 에러 객체로 정규화합니다. */
const onResponseError = (error: AxiosError<ApiErrorResponse>) => {
  const appError: AppError = {
    code: error.response?.data?.code ?? "UNKNOWN",
    fields: error.response?.data?.fields ?? {},
    message: error.response?.data?.message ?? "요청 처리에 실패했습니다.",
  };

  if (error.response?.status === 401 && !isPublicPath(error.config?.url)) {
    handleUnauthorized();
  }

  return Promise.reject(Object.assign(new Error(appError.message), appError));
};

/** 요청 인터셉터. 세션 토큰을 실어 보냅니다. */
const onRequest = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
};

export const adminAxios: AxiosInstance = axios.create(BASE_CONFIG);

adminAxios.interceptors.request.use(onRequest);
adminAxios.interceptors.response.use(onResponseSuccess, onResponseError);
