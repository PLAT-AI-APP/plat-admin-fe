import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Comment } from "@/type/comment";

export const getCommentDetail = async (commentId: number) => {
  const response = await adminAxios.get<Comment>(
    `/admin/comments/${commentId}`,
  );

  return response.data;
};

/**
 * 댓글 상세 모달에서 사용합니다.
 * 신고 관리에서 ID만 들고 넘어오는 경우가 있어 목록 행이 아니라 ID로 조회합니다.
 * commentId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 */
export const useCommentDetailQuery = (commentId: number | null) => {
  return useQuery<Comment, AppError>({
    queryKey: ["get-comment-detail", commentId],
    queryFn: () => getCommentDetail(Number(commentId)),
    enabled: commentId !== null,
  });
};
