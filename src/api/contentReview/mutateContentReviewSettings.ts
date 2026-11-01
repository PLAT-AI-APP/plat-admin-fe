import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { ContentReviewMonitor } from "@/type/contentReview";
import { contentReviewQueryKeys } from "./queryKeys";

/** 서버가 받는 동시 검수 한도 범위 */
export const MAX_CONCURRENT_MIN = 1;
export const MAX_CONCURRENT_MAX = 20;

/** 보낸 값만 바뀐다. 일시정지를 풀면 자동 멈춤(`pausedUntil`)도 함께 풀린다. */
export interface ContentReviewSettingsPayload {
  maxConcurrent?: number;
  paused?: boolean;
}

const successMessage = ({ maxConcurrent, paused }: ContentReviewSettingsPayload) => {
  if (paused === true) return "자동 검수를 일시정지했습니다. 실행 중인 검수는 끝까지 처리합니다.";
  if (paused === false) return "자동 검수를 다시 시작했습니다.";
  return `동시 검수 수를 ${maxConcurrent}개로 바꿨습니다. 진행 중인 검수는 유지되고 다음 작업부터 적용됩니다.`;
};

/** 동시 검수 한도 · 일시정지 변경. 응답 본문이 없어(204) 저장 뒤 관제 값을 다시 받는다. */
export const useContentReviewSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, ContentReviewSettingsPayload>({
    mutationKey: ["put-content-review-settings"],
    mutationFn: async (payload) => {
      await liveAxios.put("/content-reviews/settings", payload);
    },
    onSuccess: (_, payload) => {
      showAppToast("success", successMessage(payload));
      // 다시 받기 전까지 옛 값이 보이면 그 값을 기준으로 다음 변경을 계산한다. 저장한 값을 먼저 반영한다.
      queryClient.setQueriesData<ContentReviewMonitor>(
        { queryKey: ["content-review", "monitor"] },
        (monitor) =>
          monitor && {
            ...monitor,
            settings: { ...monitor.settings, ...payload, ...(payload.paused === false && { pausedUntil: null }) },
          },
      );
      queryClient.invalidateQueries({ queryKey: contentReviewQueryKeys.all() });
    },
    onError: (error) => showErrorToast(error),
  });
};
