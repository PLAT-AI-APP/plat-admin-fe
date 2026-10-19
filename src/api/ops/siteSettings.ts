import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { SiteSettings, SiteSettingsRequest } from "@/type/ops";

const SITE_SETTINGS_KEY = ["get-site-settings"] as const;

export const getSiteSettings = async () => {
  const response = await liveAxios.get<SiteSettings>("/site-settings");

  return response.data;
};

/** 사이트 설정(푸터 사업자 정보 · 베타 배너). */
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
