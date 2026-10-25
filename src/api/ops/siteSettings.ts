import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  SignupPause,
  SiteSettings,
  SiteSettingsRequest,
} from "@/type/ops";

const SITE_SETTINGS_KEY = ["get-site-settings"] as const;
const SIGNUP_PAUSE_KEY = ["get-signup-pause"] as const;

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
