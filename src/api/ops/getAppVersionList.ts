import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { AppVersion } from "@/type/ops";

export const getAppVersionList = async () => {
  const response = await adminAxios.get<AppVersion[]>("/admin/app-versions");

  return response.data;
};

/** 플랫폼별 앱 버전 정책을 조회합니다. (iOS / Android 각 1건) */
export const useAppVersionListQuery = () => {
  return useQuery<AppVersion[], AppError>({
    queryKey: ["get-app-version-list"],
    queryFn: getAppVersionList,
  });
};
