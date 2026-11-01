import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { ContentReviewBulkRetryResult, ContentReviewTask } from "@/type/contentReview";
import { contentReviewQueryKeys } from "./queryKeys";

/** 서버가 받는 판정 사유 최대 길이 */
export const DECISION_REASON_MAX = 500;

export interface ContentReviewDecisionPayload {
  taskId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
  /** 이미지 승인에만 보낸다. true 는 성인, false 는 일반. */
  imageAdult?: boolean;
}

/**
 * 판정 · 재검수 뒤 공통 처리. 성공하면 새 작업이 생겨 건수와 탭 목록이 모두 바뀐다.
 * 409 는 그사이 대상이 바뀌었거나 이미 처리된 건이라, 이전 입력으로 다시 보내지 않고 최신 목록을 받는다.
 */
const useInvalidateContentReviews = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: contentReviewQueryKeys.all() });
};

const handleTaskError = (error: AppError, invalidate: () => void) => {
  showErrorToast(error);
  if (error.status === 409) invalidate();
};

/** 관리자 승인 · 반려. 이전 작업은 이력으로 남고 새 판정 작업이 돌아온다. */
export const useContentReviewDecisionMutation = () => {
  const invalidate = useInvalidateContentReviews();

  return useMutation<ContentReviewTask, AppError, ContentReviewDecisionPayload>({
    mutationKey: ["post-content-review-decision"],
    mutationFn: async ({ taskId, ...body }) =>
      (await liveAxios.post<ContentReviewTask>(`/content-reviews/${taskId}/decision`, body)).data,
    onSuccess: (_, { decision }) => {
      showAppToast("success", decision === "APPROVE" ? "승인했습니다." : "반려했습니다.");
      invalidate();
    },
    onError: (error) => handleTaskError(error, invalidate),
  });
};

/** AI 재검수 요청. 새 작업이 자동 검수 대기로 들어가고 그동안 공개는 보류된다. */
export const useContentReviewRetryMutation = () => {
  const invalidate = useInvalidateContentReviews();

  return useMutation<ContentReviewTask, AppError, string>({
    mutationKey: ["post-content-review-retry"],
    mutationFn: async (taskId) =>
      (await liveAxios.post<ContentReviewTask>(`/content-reviews/${taskId}/retry`)).data,
    onSuccess: () => {
      showAppToast("success", "AI 재검수를 요청했습니다. 자동 검수 대기 탭에서 진행을 볼 수 있습니다.");
      invalidate();
    },
    onError: (error) => handleTaskError(error, invalidate),
  });
};

/** 한 번에 다시 맡길 수 있는 최대 건수. 서버 한도와 같다. */
export const BULK_RETRY_MAX = 50;

/**
 * AI 장애로 넘어온 건 여러 개를 AI 에 다시 맡긴다. 건별로 성공 · 실패가 따로 온다.
 * 그사이 처리된 건은 실패로 돌아오므로 건수만 알리고 목록을 새로 받는다.
 */
/**
 * 건너뛴 이유별 건수. 서버는 건마다 실패 코드를 준다 — CONFLICT·NOT_FOUND 는 그사이 처리·변경된 건,
 * *_NOT_FOUND 는 원본(세계관·이미지)이 지워진 건이다. 건너뛴 건이 없으면 undefined.
 */
const bulkRetrySkipReasons = (results: ContentReviewBulkRetryResult["results"]) => {
  const failed = results.filter((result) => !result.ok);
  if (!failed.length) return undefined;
  const changed = failed.filter((result) => result.errorCode === "CONFLICT" || result.errorCode === "NOT_FOUND").length;
  const missing = failed.filter(
    (result) => result.errorCode !== "NOT_FOUND" && result.errorCode?.endsWith("_NOT_FOUND"),
  ).length;
  const other = failed.length - changed - missing;

  return [
    changed && `이미 처리·변경됨 ${changed}건`,
    missing && `원본이 삭제됨 ${missing}건`,
    other && `기타 오류 ${other}건`,
  ]
    .filter(Boolean)
    .join(" · ");
};

export const useContentReviewBulkRetryMutation = () => {
  const invalidate = useInvalidateContentReviews();

  return useMutation<ContentReviewBulkRetryResult, AppError, string[]>({
    mutationKey: ["post-content-review-retry-bulk"],
    mutationFn: async (taskIds) =>
      (
        await liveAxios.post<ContentReviewBulkRetryResult>("/content-reviews/retry-bulk", {
          taskIds,
        })
      ).data,
    onSuccess: ({ results }) => {
      const succeeded = results.filter((result) => result.ok).length;
      const skipped = bulkRetrySkipReasons(results);
      if (!skipped) {
        showAppToast("success", `${succeeded}건을 AI 에 다시 맡겼습니다.`);
      } else {
        showAppToast(
          succeeded ? "warning" : "error",
          succeeded ? `${succeeded}건을 다시 맡기고 나머지는 건너뛰었습니다.` : "다시 맡긴 건이 없습니다.",
          { description: skipped },
        );
      }
      invalidate();
    },
    onError: (error) => handleTaskError(error, invalidate),
  });
};
