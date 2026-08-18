import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Notice } from "@/type/notice";

export const getNoticeDetail = async (noticeId: number) => {
  const response = await adminAxios.get<Notice>(`/admin/notices/${noticeId}`);

  return response.data;
};

/**
 * 공지 상세 모달에서 사용합니다.
 * 댓글 관리처럼 다른 화면에서 ID만 들고 넘어오는 경우가 있어 목록 행이 아니라 ID로 조회합니다.
 * noticeId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 */
export const useNoticeDetailQuery = (noticeId: number | null) => {
  return useQuery<Notice, AppError>({
    queryKey: ["get-notice-detail", noticeId],
    queryFn: () => getNoticeDetail(Number(noticeId)),
    enabled: noticeId !== null,
  });
};
