import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { AppVersion, AppVersionFormValues } from "@/type/ops";
import { showAppToast } from "@/lib/toast";

export const createAppVersion = async (values: AppVersionFormValues) => {
  const response = await adminAxios.post<AppVersion>(
    "/admin/app-versions",
    values,
  );

  return response.data;
};

export const updateAppVersion = async (
  versionId: number,
  values: AppVersionFormValues,
) => {
  const response = await adminAxios.put<AppVersion>(
    `/admin/app-versions/${versionId}`,
    values,
  );

  return response.data;
};

/** 앱 버전 정책 등록·수정 후 목록을 갱신합니다. */
export const useAppVersionMutation = () => {
  const queryClient = useQueryClient();

  const invalidateAppVersionList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-app-version-list"] });

  const createMutation = useMutation<AppVersion, AppError, AppVersionFormValues>(
    {
      mutationFn: createAppVersion,
      onSuccess: () => {
        showAppToast("success", "앱 버전 정책을 등록했습니다.");
        invalidateAppVersionList();
      },
    },
  );

  const updateMutation = useMutation<
    AppVersion,
    AppError,
    { versionId: number; values: AppVersionFormValues }
  >({
    mutationFn: ({ versionId, values }) => updateAppVersion(versionId, values),
    onSuccess: () => {
      showAppToast("success", "앱 버전 정책을 수정했습니다.");
      invalidateAppVersionList();
    },
  });

  return { createMutation, updateMutation };
};
