import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { QnaCategory, QnaItem, QnaStatus } from "@/type/communication";

export interface QnaListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열은 전체 조회를 의미한다. */
  status?: QnaStatus | "";
  category?: QnaCategory | "";
}

export const getQnaList = async (params: QnaListParams) => {
  const response = await adminAxios.get<PageResponse<QnaItem>>("/admin/qna", {
    params,
  });

  return response.data;
};

/** Q&A 목록 화면에서 상태 탭·카테고리 필터·검색·페이지네이션과 함께 사용합니다. */
export const useQnaListQuery = (params: QnaListParams) => {
  return useQuery<PageResponse<QnaItem>, AppError>({
    queryKey: ["get-qna-list", params],
    queryFn: () => getQnaList(params),
  });
};
