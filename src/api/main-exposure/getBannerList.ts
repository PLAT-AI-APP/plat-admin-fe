import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner } from "@/type/mainExposure";

export const getBannerList = async () => {
  const response = await adminAxios.get<Banner[]>("/admin/main/banners");

  return response.data;
};

/** 메인 화면 최상단 캐러셀에 노출되는 배너 목록을 조회합니다. */
export const useBannerListQuery = () => {
  return useQuery<Banner[], AppError>({
    queryKey: ["get-banner-list"],
    queryFn: getBannerList,
  });
};
