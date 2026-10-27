import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import { contentReviewQueryKeys } from "./queryKeys";

/** 서버가 받는 동시 검수 한도 범위 */
export const MAX_CONCURRENT_MIN = 1;
export const MAX_CONCURRENT_MAX = 20;

/**
 * 동시 검수 한도 변경. 응답 본문이 없어(204) 저장 뒤 설정을 다시 받는다.
 * 진행 중인 검수는 취소하지 않고 다음 작업부터 적용된다.
 */
export const useContentReviewSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, number>({
    mutationKey: ["put-content-review-settings"],
    mutationFn: async (maxConcurrent) => {
      await liveAxios.put("/content-reviews/settings", { maxConcurrent });
    },
    onSuccess: (_, maxConcurrent) => {
      showAppToast(
        "success",
        `동시 검수 수를 ${maxConcurrent}개로 바꿨습니다. 진행 중인 검수는 유지되고 다음 작업부터 적용됩니다.`,
      );
      queryClient.invalidateQueries({ queryKey: contentReviewQueryKeys.settings() });
    },
    onError: (error) => showErrorToast(error),
  });
};
