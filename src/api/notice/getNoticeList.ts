import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Notice, NoticeCategory, NoticeStatus } from "@/type/notice";

export interface NoticeListParams {
  page: number;
  size: number;
  keyword?: string;
  category?: NoticeCategory | "";
  status?: NoticeStatus | "";
}

export const getNoticeList = async (params: NoticeListParams) => {
  const response = await adminAxios.get<PageResponse<Notice>>(
    "/admin/notices",
    { params },
  );

  return response.data;
};

/** 공지사항 목록 화면에서 검색·필터·페이지네이션과 함께 사용합니다. */
export const useNoticeListQuery = (params: NoticeListParams) => {
  return useQuery<PageResponse<Notice>, AppError>({
    queryKey: ["get-notice-list", params],
    queryFn: () => getNoticeList(params),
  });
};
