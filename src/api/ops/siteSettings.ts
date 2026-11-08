import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  PaymentPause,
  RefundExecutionPause,
  SignupPause,
  SiteSettings,
  SiteSettingsRequest,
} from "@/type/ops";

const SITE_SETTINGS_KEY = ["get-site-settings"] as const;
const SIGNUP_PAUSE_KEY = ["get-signup-pause"] as const;
const PAYMENT_PAUSE_KEY = ["get-payment-pause"] as const;
const REFUND_EXECUTION_PAUSE_KEY = ["get-refund-execution-pause"] as const;

export const getSiteSettings = async () => {
  const response = await liveAxios.get<SiteSettings>("/site-settings");

  return response.data;
};

/** 사이트 설정(푸터 사업자 정보 · 고객센터). */
export const useSiteSettingsQuery = () =>
  usePermittedQuery<SiteSettings>("siteSetting:read", {
    queryKey: SITE_SETTINGS_KEY,
    queryFn: getSiteSettings,
  });

/**
 * 사이트 설정 저장. 통째로 바꾼다(PUT).
 * 사용자 사이트는 60초 캐시로 읽으므로 저장 뒤 최대 1분 안에 반영된다.
 */
export const useSiteSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SiteSettings, AppError, SiteSettingsRequest>({
    mutationFn: async (body) =>
      (await liveAxios.put<SiteSettings>("/site-settings", body)).data,
    onSuccess: (saved) => {
      showAppToast(
        "success",
        "사이트 설정을 저장했습니다. 1분 안에 사용자 화면에 반영됩니다.",
      );
      queryClient.setQueryData(SITE_SETTINGS_KEY, saved);
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 신규 가입 일시 중단 여부. */
export const useSignupPauseQuery = () =>
  usePermittedQuery<SignupPause>("siteSetting:read", {
    queryKey: SIGNUP_PAUSE_KEY,
    queryFn: async () =>
      (await liveAxios.get<SignupPause>("/site-settings/signup-pause")).data,
  });

/** 신규 가입 중단·재개. 모든 서버에 바로 반영된다. */
export const useSignupPauseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SignupPause, AppError, SignupPause>({
    mutationFn: async (body) =>
      (await liveAxios.put<SignupPause>("/site-settings/signup-pause", body))
        .data,
    onSuccess: (saved) => {
      showAppToast(
        "success",
        saved.paused ? "신규 가입을 막았습니다." : "신규 가입을 다시 열었습니다.",
      );
      queryClient.setQueryData(SIGNUP_PAUSE_KEY, saved);
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 신규 결제 중단 여부. */
export const usePaymentPauseQuery = () =>
  usePermittedQuery<PaymentPause>("siteSetting:read", {
    queryKey: PAYMENT_PAUSE_KEY,
    queryFn: async () =>
      (await liveAxios.get<PaymentPause>("/site-settings/payment-pause")).data,
  });

/**
 * 신규 결제 중단·재개. 모든 서버에 바로 반영된다.
 *
 * 서버가 요청마다 Redis를 보므로 재배포 없이 먹는다. 다만 중단 직전에 검사를
 * 통과한 요청은 그대로 승인될 수 있다.
 */
export const usePaymentPauseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<PaymentPause, AppError, PaymentPause>({
    mutationFn: async (body) =>
      (await liveAxios.put<PaymentPause>("/site-settings/payment-pause", body))
        .data,
    onSuccess: (saved) => {
      showAppToast(
        "success",
        saved.paused
          ? "신규 결제를 막았습니다."
          : "신규 결제를 다시 열었습니다.",
      );
      queryClient.setQueryData(PAYMENT_PAUSE_KEY, saved);
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 환불 실행 중단 여부. */
export const useRefundExecutionPauseQuery = () =>
  usePermittedQuery<RefundExecutionPause>("siteSetting:read", {
    queryKey: REFUND_EXECUTION_PAUSE_KEY,
    queryFn: async () =>
      (
        await liveAxios.get<RefundExecutionPause>(
          "/site-settings/refund-execution-pause",
        )
      ).data,
  });

/**
 * 환불 실행 중단·재개. 신규 결제 중단과 독립적이다.
 *
 * 재개해도 중단 기간에 쌓인 신청이 자동 승인되지는 않는다. 관리자가 다시 승인해야 한다.
 */
export const useRefundExecutionPauseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<RefundExecutionPause, AppError, RefundExecutionPause>({
    mutationFn: async (body) =>
      (
        await liveAxios.put<RefundExecutionPause>(
          "/site-settings/refund-execution-pause",
          body,
        )
      ).data,
    onSuccess: (saved) => {
      showAppToast(
        "success",
        saved.paused
          ? "환불 실행을 막았습니다. 사용자 신청은 계속 접수됩니다."
          : "환불 실행을 다시 열었습니다. 쌓인 신청은 직접 승인해 주세요.",
      );
      queryClient.setQueryData(REFUND_EXECUTION_PAUSE_KEY, saved);
    },
    onError: (error) => showErrorToast(error),
  });
};
