import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner, LanguageCount } from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";

export const getBannerList = async (language: ServiceLanguage) => {
  const response = await adminAxios.get<Banner[]>("/admin/main/banners", {
    params: { language },
  });

  return response.data;
};

export const getBannerLanguageCounts = async () => {
  const response = await adminAxios.get<LanguageCount[]>(
    "/admin/main/banners/languages",
  );

  return response.data;
};

/**
 * 해당 언어의 메인 캐러셀 배너 목록을 조회합니다.
 *
 * 배너는 언어마다 다른 목록이므로 언어가 캐시 키에 들어갑니다.
 * 언어를 빼면 탭을 옮길 때 이전 언어의 목록이 그대로 보입니다.
 */
export const useBannerListQuery = (language: ServiceLanguage) => {
  return useQuery<Banner[], AppError>({
    queryKey: ["get-banner-list", language],
    queryFn: () => getBannerList(language),
  });
};

/** 언어 탭에 등록 건수를 함께 그리기 위한 조회입니다. 비어 있는 언어를 눌러 보지 않고도 압니다. */
export const useBannerLanguageCountQuery = () => {
  return useQuery<LanguageCount[], AppError>({
    queryKey: ["get-banner-language-counts"],
    queryFn: getBannerLanguageCounts,
  });
};
