import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  HomeSectionItem,
  HomeSectionKey,
  HomeSectionTargetType,
  LanguageCount,
} from "@/type/mainExposure";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import { showAppToast } from "@/lib/toast";

/**
 * 실서버(plat-admin) 메인 섹션 편성. 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋
 * 추천이 공유한다.
 *
 * **서버는 목록 전체를 한 번에 덮어쓰지 않는다.** 등록(POST) · 해제(DELETE)는
 * 한 건씩이고, 순서(PATCH /order)만 섹션 · 언어 전체를 한 번에 받는다.
 * 화면의 "저장" 버튼 하나로 세 가지를 묶으면 중간에 실패했을 때 서버와 화면이
 * 어긋나므로, 화면도 서버와 같은 단위로 나눠 부른다.
 */

/** 캐시 키. 섹션 · 언어 한 칸이 곧 하나의 목록이다. */
const listKey = (section: HomeSectionKey, language: ServiceLanguage) => [
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
    queryKey: listKey(section, language),
    queryFn: () => getHomeSectionItems(section, language),
  });

/**
 * 언어 탭에 붙는 건수입니다.
 *
 * **서버에 요약 엔드포인트가 없어 언어마다 목록을 받아 셉니다.** 목록 조회와
 * 같은 캐시 키를 써서, 지금 보고 있는 언어는 다시 부르지 않고 편집으로 목록이
 * 무효화되면 그 언어의 숫자도 함께 다시 셉니다.
 */
export const useHomeSectionLanguageCounts = (
  section: HomeSectionKey,
): LanguageCount[] =>
  useQueries({
    queries: SERVICE_LANGUAGES.map((language) => ({
      queryKey: listKey(section, language),
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

interface AddHomeSectionVariables {
  targetType: HomeSectionTargetType;
  targetId: string;
}

interface ChangeScenarioVariables {
  homeSectionId: string;
  /** null이면 지정을 해제한다. 무엇을 대신 보여 줄지는 앱이 정한다. */
  scenarioId: string | null;
}

/**
 * 편성 등록 훅입니다. 섹션 맨 뒤에 붙습니다.
 *
 * 여러 건을 고른 경우에도 서버가 받는 단위는 한 건이라 순서대로 이어 부릅니다.
 * 중간에 실패하면 그때까지 등록된 건은 남습니다 — 목록을 다시 받아 무엇이
 * 들어갔는지 화면이 사실대로 보여 줍니다.
 */
export const useHomeSectionAddMutation = (
  section: HomeSectionKey,
  language: ServiceLanguage,
) => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, AddHomeSectionVariables[]>({
    mutationFn: async (targets) => {
      for (const target of targets) {
        await liveAxios.post("/admin/home-sections", {
          section,
          language,
          targetType: target.targetType,
          targetId: target.targetId,
        });
      }
    },
    onSuccess: (_, targets) => {
      showAppToast("success", `${targets.length}건을 편성했습니다.`);
    },
    // 실패해도 일부는 들어갔을 수 있다. 성공 · 실패 모두 서버 목록을 다시 받는다.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey(section, language) });
    },
  });
};

/** 편성 해제 훅입니다. 남은 항목의 순서는 서버가 다시 매기지 않습니다. */
export const useHomeSectionRemoveMutation = (
  section: HomeSectionKey,
  language: ServiceLanguage,
) => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, string>({
    mutationFn: async (homeSectionId) => {
      await liveAxios.delete(`/admin/home-sections/${homeSectionId}`);
    },
    onSuccess: () => {
      showAppToast("success", "편성에서 뺐습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey(section, language) });
    },
  });
};

/**
 * 맛보기 회차 지정 · 해제 훅입니다.
 *
 * **편성을 지웠다 다시 넣지 않습니다.** 그러면 회차만 바꿨는데 순서가 맨 뒤로
 * 밀립니다. 서버도 회차만 바꾸는 길을 따로 두고 있습니다.
 */
export const useHomeSectionScenarioMutation = (
  section: HomeSectionKey,
  language: ServiceLanguage,
) => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, ChangeScenarioVariables>({
    mutationFn: async ({ homeSectionId, scenarioId }) => {
      await liveAxios.patch(`/admin/home-sections/${homeSectionId}/scenario`, {
        scenarioId,
      });
    },
    onSuccess: (_, { scenarioId }) => {
      showAppToast(
        "success",
        scenarioId ? "맛보기 회차를 지정했습니다." : "맛보기 회차를 해제했습니다.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey(section, language) });
    },
  });
};

/**
 * 순서 저장 훅입니다.
 *
 * **섹션 · 언어의 편성 전체를 원하는 순서대로 보냅니다.** 일부만 보내면 서버가
 * 순서 불일치로 거부합니다.
 */
export const useHomeSectionReorderMutation = (
  section: HomeSectionKey,
  language: ServiceLanguage,
) => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, string[]>({
    mutationFn: async (orderedIds) => {
      await liveAxios.patch("/admin/home-sections/order", {
        section,
        language,
        orderedIds,
      });
    },
    onSuccess: () => {
      showAppToast("success", "순서를 저장했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey(section, language) });
    },
  });
};
