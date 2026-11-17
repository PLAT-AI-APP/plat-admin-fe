import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner, BannerBadge, LanguageCount } from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";

/**
 * 서버가 내려주는 배너 한 줄.
 *
 * 없는 값은 `null`로 오고 화면은 `undefined`로 다룬다.
 * `thumbnailUrl`은 목록용 축소본이라 크게 보여줄 자리에는 `backgroundImageUrl`을 쓴다.
 */
export interface BannerResponse {
  mainBannerId: string;
  language: ServiceLanguage;
  title: string;
  description: string | null;
  badges: BannerBadge[];
  tags: string[];
  backgroundImageFileId: string;
  backgroundImageUrl: string;
  foregroundImageFileId: string | null;
  foregroundImageUrl: string | null;
  thumbnailUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export const toBanner = (banner: BannerResponse): Banner => ({
  bannerId: banner.mainBannerId,
  language: banner.language,
  title: banner.title,
  description: banner.description ?? undefined,
  badges: banner.badges,
  tags: banner.tags,
  backgroundImageFileId: banner.backgroundImageFileId,
  backgroundImageUrl: banner.backgroundImageUrl,
  foregroundImageFileId: banner.foregroundImageFileId ?? undefined,
  foregroundImageUrl: banner.foregroundImageUrl ?? undefined,
  thumbnailUrl: banner.thumbnailUrl,
  linkUrl: banner.linkUrl ?? undefined,
  isActive: banner.isActive,
  sortOrder: banner.sortOrder,
  startDate: banner.startDate ?? undefined,
  endDate: banner.endDate ?? undefined,
  createdAt: banner.createdAt,
});

export const getBannerList = async (language: ServiceLanguage) => {
  const response = await liveAxios.get<BannerResponse[]>(
    "/main-banners",
    { params: { language } },
  );

  return response.data.map(toBanner);
};

export const getBannerLanguageCounts = async () => {
  const response = await liveAxios.get<LanguageCount[]>(
    "/main-banners/languages",
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
