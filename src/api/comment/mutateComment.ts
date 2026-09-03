import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";

/**
 * 댓글 운영 조치.
 *
 * 운영은 **내리고 다시 올릴 수 있다.** 되돌릴 길을 두는 이유는 연쇄 때문이다 —
 * 루트 하나를 잘못 내리면 답글 수십 개가 함께 내려가고, 그 오조작의 대가를
 * 아무 잘못 없는 답글 작성자들이 진다.
 *
 * 작성자가 지운 댓글(`DELETED`)은 운영이 되살릴 수 없다. 그건 작성자의 것이다.
 */

export interface HideCommentParams {
  commentId: string;
  /** 서버가 사유 없는 숨김을 거절한다. 200자까지. */
  reason: string;
}

/** 서버가 204로 답한다. 바뀐 내용은 목록·상세를 다시 불러서 받는다. */
export const hideComment = async ({ commentId, reason }: HideCommentParams) => {
  await liveAxios.post(`/admin/comments/${commentId}/hide`, { reason });
};

/** 재노출은 본문이 없다. 루트를 올리면 딸려 내려갔던 답글도 함께 올라온다. */
export const restoreComment = async (commentId: string) => {
  await liveAxios.post(`/admin/comments/${commentId}/restore`);
};

export interface BulkHideCommentParams {
  commentIds: string[];
  reason: string;
}

interface BulkCommentHideResponse {
  /**
   * 실제로 내려간 건수. **보낸 건수와 다를 수 있다** — 화면이 목록을 그린 사이에
   * 누가 이미 내렸거나 작성자가 지운 댓글은 서버가 건너뛴다.
   */
  hiddenCount: number;
}

export const bulkHideComments = async (params: BulkHideCommentParams) => {
  const response = await liveAxios.post<BulkCommentHideResponse>(
    "/admin/comments/bulk-hide",
    params,
  );

  return response.data;
};

/** 댓글을 내리거나 되돌린 뒤 목록과 상세를 갱신합니다. */
export const useCommentMutation = () => {
  const queryClient = useQueryClient();

  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: ["get-comment-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-comment-detail"] });
  };

  const hideMutation = useMutation<void, AppError, HideCommentParams>({
    mutationFn: hideComment,
    onSuccess: () => {
      showAppToast("success", "댓글을 숨김 처리했습니다.");
      invalidateComments();
    },
  });

  const restoreMutation = useMutation<void, AppError, string>({
    mutationFn: restoreComment,
    onSuccess: () => {
      showAppToast("success", "댓글을 다시 노출했습니다.");
      invalidateComments();
    },
  });

  const bulkHideMutation = useMutation<
    BulkCommentHideResponse,
    AppError,
    BulkHideCommentParams
  >({
    mutationFn: bulkHideComments,
    onSuccess: ({ hiddenCount }) => {
      showAppToast("success", `댓글 ${hiddenCount}건을 처리했습니다.`);
      invalidateComments();
    },
  });

  return { hideMutation, restoreMutation, bulkHideMutation };
};
