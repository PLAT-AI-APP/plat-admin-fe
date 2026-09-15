import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  HomeSectionKey,
  HomeSectionTargetType,
} from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";
import { showAppToast } from "@/lib/toast";
import { homeSectionListKey } from "./getHomeSection";

/*
 * 메인 섹션 편성 변경.
 *
 * **서버는 목록 전체를 한 번에 덮어쓰지 않는다.** 등록(POST) · 해제(DELETE)는
 * 한 건씩이고, 순서(PATCH /order)만 섹션 · 언어 전체를 한 번에 받는다.
 * 화면의 "저장" 버튼 하나로 세 가지를 묶으면 중간에 실패했을 때 서버와 화면이
 * 어긋나므로, 화면도 서버와 같은 단위로 나눠 부른다.
 */

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
      queryClient.invalidateQueries({ queryKey: homeSectionListKey(section, language) });
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
      queryClient.invalidateQueries({ queryKey: homeSectionListKey(section, language) });
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
      queryClient.invalidateQueries({ queryKey: homeSectionListKey(section, language) });
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
      queryClient.invalidateQueries({ queryKey: homeSectionListKey(section, language) });
    },
  });
};
