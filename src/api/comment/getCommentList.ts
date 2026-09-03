import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  Comment,
  CommentSort,
  CommentStatus,
  CommentTargetType,
} from "@/type/comment";

export interface CommentListParams {
  /** 화면은 1부터, 서버는 0부터 센다. 변환은 이 파일에서만 한다. */
  page: number;
  size: number;
  keyword?: string;
  targetType?: CommentTargetType | "";
  status?: CommentStatus | "";
  /** 신고가 1건 이상인 댓글만 조회한다. false는 조건 없음이라 아예 보내지 않는다. */
  onlyReported?: boolean;
  /** 특정 유저가 쓴 댓글만 조회한다. (유저 상세에서 사용) */
  authorId?: string;
  sort?: CommentSort;
}

/**
 * 서버 목록 한 줄. ID는 API 경계에서 문자열로 온다(Snowflake 규약).
 *
 * 상세도 **같은 모양**을 내려준다. 서버가 항목을 따로 두지 않는 이유는
 * `getCommentDetail`의 주석에 있다.
 */
export interface CommentItemResponse {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  targetName: string | null;
  parentCommentId: string | null;
  content: string;
  authorId: string;
  authorNickname: string;
  status: CommentStatus;
  cascaded: boolean;
  reportCount: number;
  likeCount: number;
  replyCount: number;
  hiddenReason: string | null;
  handledBy: string | null;
  handledById: number | null;
  handledAt: string | null;
  createdAt: string;
}

export const toComment = (item: CommentItemResponse): Comment => ({
  commentId: item.id,
  targetType: item.targetType,
  targetId: item.targetId,
  targetName: item.targetName,
  parentCommentId: item.parentCommentId,
  content: item.content,
  authorId: item.authorId,
  authorNickname: item.authorNickname,
  status: item.status,
  cascaded: item.cascaded,
  reportCount: item.reportCount,
  likeCount: item.likeCount,
  replyCount: item.replyCount,
  hiddenReason: item.hiddenReason,
  handledBy: item.handledBy,
  handledById: item.handledById,
  handledAt: item.handledAt,
  createdAt: item.createdAt,
});

/** 빈 문자열 필터는 아예 빼고, 페이지는 0부터로 낮춰 서버가 받는 형태로 만든다. */
const toRequestParams = (params: CommentListParams) => {
  const clean: Record<string, string | number | boolean> = {
    page: Math.max(params.page - 1, 0),
    size: params.size,
  };
  if (params.keyword?.trim()) clean.keyword = params.keyword.trim();
  if (params.targetType) clean.targetType = params.targetType;
  if (params.status) clean.status = params.status;
  if (params.onlyReported) clean.onlyReported = true;
  if (params.authorId) clean.authorId = params.authorId;
  if (params.sort) clean.sort = params.sort;

  return clean;
};

export const getCommentList = async (
  params: CommentListParams,
): Promise<PageResponse<Comment>> => {
  const response = await liveAxios.get<PageWith<CommentItemResponse>>(
    "/admin/comments",
    { params: toRequestParams(params) },
  );

  const page = toPageResponse(response.data);

  return { ...page, content: page.content.map(toComment) };
};

/** 전 영역의 댓글을 한 화면에서 조회합니다. 대상 종류는 targetType으로 구분합니다. */
export const useCommentListQuery = (params: CommentListParams) => {
  return useQuery<PageResponse<Comment>, AppError>({
    queryKey: ["get-comment-list", params],
    queryFn: () => getCommentList(params),
  });
};
