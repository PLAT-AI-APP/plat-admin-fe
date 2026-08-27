import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { NoticeCategory, NoticeDetail, NoticeStatus } from "@/type/notice";

export interface NoticeDetailResponse {
  noticeId: string;
  category: NoticeCategory;
  title: string;
  content: string;
  status: NoticeStatus;
  isPinned: boolean;
  viewCount: number;
  createdBy: string;
  createdById: number | null;
  updatedBy: string | null;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export const toNoticeDetail = (notice: NoticeDetailResponse): NoticeDetail => ({
  ...notice,
  noticeId: Number(notice.noticeId),
  createdById: notice.createdById ?? undefined,
  updatedBy: notice.updatedBy ?? undefined,
  updatedById: notice.updatedById ?? undefined,
  updatedAt: notice.updatedAt ?? undefined,
});

export const getNoticeDetail = async (noticeId: number): Promise<NoticeDetail> => {
  const response = await liveAxios.get<NoticeDetailResponse>(
    `/admin/notices/${noticeId}`,
  );

  return toNoticeDetail(response.data);
};

/**
 * 공지 상세 모달에서 사용합니다.
 * 댓글 관리처럼 다른 화면에서 ID만 들고 넘어오는 경우가 있어 목록 행이 아니라 ID로 조회합니다.
 * noticeId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 */
export const useNoticeDetailQuery = (noticeId: number | null) => {
  return useQuery<NoticeDetail, AppError>({
    queryKey: ["get-notice-detail", noticeId],
    queryFn: () => getNoticeDetail(Number(noticeId)),
    enabled: noticeId !== null,
  });
};
