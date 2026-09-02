import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import { toComment, type CommentItemResponse } from "./getCommentList";
import type { AppError } from "@/type/api";
import type { Comment } from "@/type/comment";

export const getCommentDetail = async (
  commentId: string,
): Promise<Comment> => {
  const response = await liveAxios.get<CommentItemResponse>(
    `/admin/comments/${commentId}`,
  );

  return toComment(response.data);
};

/**
 * 댓글 상세 모달에서 사용합니다.
 * 신고 관리에서 ID만 들고 넘어오는 경우가 있어 목록 행이 아니라 ID로 조회합니다.
 * commentId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 *
 * 서버가 내려주는 항목은 목록 한 줄과 같습니다. 상세를 따로 두는 이유는 항목이 달라서가 아니라
 * **목록 행 없이 ID만으로 열리는 경로**가 있기 때문입니다.
 */
export const useCommentDetailQuery = (commentId: string | null) => {
  return useQuery<Comment, AppError>({
    queryKey: ["get-comment-detail", commentId],
    queryFn: () => getCommentDetail(String(commentId)),
    enabled: commentId !== null,
  });
};
