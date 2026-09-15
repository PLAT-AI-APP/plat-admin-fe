import { useQueries, useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  HomeSectionItem,
  HomeSectionKey,
  HomeSectionTargetType,
  LanguageCount,
} from "@/type/mainExposure";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";

/**
 * 실서버(plat-admin) 메인 섹션 편성 조회. 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋
 * 추천이 공유한다. 편성 변경은 `mutateHomeSection.ts`에 있다.
 */

/** 캐시 키. 섹션 · 언어 한 칸이 곧 하나의 목록이다. 변경 훅이 같은 키로 무효화한다. */
export const homeSectionListKey = (section: HomeSectionKey, language: ServiceLanguage) => [
  "get-home-section",
  section,
  language,
];

/** 서버 응답 한 줄. ID는 API 경계에서 문자열로 온다(Snowflake 규약). */
interface HomeSectionItemResponse {
  id: string;
  targetType: HomeSectionTargetType;
  targetId: string;
  targetName: string;
  profileImageId: string | null;
  sortOrder: number;
  scenarioId: string | null;
  scenarioTitle: string | null;
  /** 편성돼 있어도 대상이 삭제 · 비공개 · 심사 미통과면 앱에 나가지 않는다. */
  exposed: boolean;
  hiddenReason: string | null;
}

const toItem = (item: HomeSectionItemResponse): HomeSectionItem => ({
  homeSectionId: item.id,
  targetType: item.targetType,
  targetId: item.targetId,
  targetName: item.targetName,
  profileImageFileId: item.profileImageId,
  sortOrder: item.sortOrder,
  scenarioId: item.scenarioId,
  scenarioTitle: item.scenarioTitle,
  exposed: item.exposed,
  hiddenReason: item.hiddenReason,
});

export const getHomeSectionItems = async (
  section: HomeSectionKey,
  language: ServiceLanguage,
): Promise<HomeSectionItem[]> => {
  const response = await liveAxios.get<HomeSectionItemResponse[]>(
    "/admin/home-sections",
    { params: { section, language } },
  );

  return response.data.map(toItem);
};

/** 섹션 · 언어 한 칸의 편성 목록입니다. 노출 순서대로 옵니다. */
export const useHomeSectionQuery = (
  section: HomeSectionKey,
  language: ServiceLanguage,
) =>
  useQuery<HomeSectionItem[], AppError>({
    queryKey: homeSectionListKey(section, language),
    queryFn: () => getHomeSectionItems(section, language),
  });

/**
 * 언어 탭에 붙는 건수입니다.
 *
 * **서버에 요약 엔드포인트가 없어 언어마다 목록을 받아 셉니다.** 목록 조회와
 * 같은 캐시 키를 써서, 지금 보고 있는 언어는 다시 부르지 않고 편집으로 목록이
 * 무효화되면 그 언어의 숫자도 함께 다시 셉니다.
 */
export const useHomeSectionLanguageCountQuery = (
  section: HomeSectionKey,
): LanguageCount[] =>
  useQueries({
    queries: SERVICE_LANGUAGES.map((language) => ({
      queryKey: homeSectionListKey(section, language),
      queryFn: () => getHomeSectionItems(section, language),
    })),
    combine: (results) =>
      SERVICE_LANGUAGES.map((language, index) => ({
        language,
        // 아직 못 받은 언어는 숫자를 비운다. 0을 먼저 그리면 "없다"로 읽힌다.
        count: results[index].data?.length,
      })).filter(
        (item): item is LanguageCount => item.count !== undefined,
      ),
  });
