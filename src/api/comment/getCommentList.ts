import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  Comment,
  CommentStatus,
  CommentTargetType,
} from "@/type/comment";

export interface CommentListParams {
  page: number;
  size: number;
  keyword?: string;
  targetType?: CommentTargetType | "";
  status?: CommentStatus | "";
  /** 신고가 1건 이상인 댓글만 조회한다. */
  onlyReported?: boolean;
  /** 특정 유저가 쓴 댓글만 조회한다. (유저 상세에서 사용) */
  authorId?: string;
  sort?: "RECENT" | "REPORTED";
}

export const getCommentList = async (params: CommentListParams) => {
  const response = await adminAxios.get<PageResponse<Comment>>(
    "/admin/comments",
    { params },
  );

  return response.data;
};

/** 전 영역의 댓글을 한 화면에서 조회합니다. 대상 종류는 targetType으로 구분합니다. */
export const useCommentListQuery = (params: CommentListParams) => {
  return useQuery<PageResponse<Comment>, AppError>({
    queryKey: ["get-comment-list", params],
    queryFn: () => getCommentList(params),
  });
};
