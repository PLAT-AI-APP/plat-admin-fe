import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  NoticeCategory,
  NoticeStatus,
  NoticeSummary,
} from "@/type/notice";

export interface NoticeListParams {
  page: number;
  size: number;
  keyword?: string;
  category?: NoticeCategory | "";
  status?: NoticeStatus | "";
}

/** 서버 목록 항목. NoticeId는 JSON에서 문자열로 내려온다. */
interface NoticeSummaryResponse {
  noticeId: string;
  category: NoticeCategory;
  title: string;
  status: NoticeStatus;
  isPinned: boolean;
  viewCount: number;
  createdBy: string;
  createdById: number | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

const toNoticeSummary = (notice: NoticeSummaryResponse): NoticeSummary => ({
  ...notice,
  noticeId: Number(notice.noticeId),
  createdById: notice.createdById ?? undefined,
  updatedBy: notice.updatedBy ?? undefined,
  updatedAt: notice.updatedAt ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: NoticeListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  category: params.category || undefined,
  status: params.status || undefined,
});

export const getNoticeList = async (
  params: NoticeListParams,
): Promise<PageResponse<NoticeSummary>> => {
  const response = await liveAxios.get<PageWith<NoticeSummaryResponse>>(
    "/admin/notices",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toNoticeSummary),
  });
};

/** 공지사항 목록 화면에서 검색·필터·페이지네이션과 함께 사용합니다. */
export const useNoticeListQuery = (params: NoticeListParams) => {
  return useQuery<PageResponse<NoticeSummary>, AppError>({
    queryKey: ["get-notice-list", params],
    queryFn: () => getNoticeList(params),
  });
};
