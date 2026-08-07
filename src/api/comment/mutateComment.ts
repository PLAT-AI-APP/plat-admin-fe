import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { Comment, CommentStatus } from "@/type/comment";

export interface UpdateCommentStatusParams {
  commentId: number;
  status: CommentStatus;
  /** 숨김 처리할 때는 사유를 남긴다. */
  reason?: string;
}

export const updateCommentStatus = async ({
  commentId,
  status,
  reason,
}: UpdateCommentStatusParams) => {
  const response = await adminAxios.patch<Comment>(
    `/admin/comments/${commentId}/status`,
    { status, reason },
  );

  return response.data;
};

export interface BulkUpdateCommentStatusParams {
  commentIds: number[];
  status: CommentStatus;
  reason?: string;
}

export const bulkUpdateCommentStatus = async (
  params: BulkUpdateCommentStatusParams,
) => {
  const response = await adminAxios.patch<{ updatedCount: number }>(
    "/admin/comments/bulk-status",
    params,
  );

  return response.data;
};

/** 댓글 노출 상태 변경 후 목록을 갱신합니다. */
export const useCommentMutation = () => {
  const queryClient = useQueryClient();

  const invalidateCommentList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-comment-list"] });

  const statusMutation = useMutation<
    Comment,
    AppError,
    UpdateCommentStatusParams
  >({
    mutationFn: updateCommentStatus,
    onSuccess: (comment) => {
      showAppToast(
        "success",
        comment.status === "VISIBLE"
          ? "댓글을 다시 노출했습니다."
          : "댓글을 숨김 처리했습니다.",
      );
      invalidateCommentList();
    },
  });

  const bulkStatusMutation = useMutation<
    { updatedCount: number },
    AppError,
    BulkUpdateCommentStatusParams
  >({
    mutationFn: bulkUpdateCommentStatus,
    onSuccess: ({ updatedCount }) => {
      showAppToast("success", `댓글 ${updatedCount}건을 처리했습니다.`);
      invalidateCommentList();
    },
  });

  return { statusMutation, bulkStatusMutation };
};
