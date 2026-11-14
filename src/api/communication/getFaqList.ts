import { keepPreviousData } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { FaqCategory, FaqItem } from "@/type/communication";

export interface FaqListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열은 전체 조회를 의미한다. */
  category?: FaqCategory | "";
}

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: FaqListParams) => ({
  ...toPageRequest(params),
  keyword: params.keyword?.trim() || undefined,
  category: params.category || undefined,
});

export const getFaqList = async (
  params: FaqListParams,
): Promise<PageResponse<FaqItem>> => {
  const response = await liveAxios.get<PageWith<FaqItem>>("/faqs", {
    params: toRequestParams(params),
  });

  return toPageResponse(response.data);
};

/** FAQ 관리 목록에서 카테고리 필터·검색·페이지네이션과 함께 사용합니다. 서버가 카테고리 순서 → 순서로 정렬해 준다. */
export const useFaqListQuery = (params: FaqListParams) => {
  return usePermittedQuery<PageResponse<FaqItem>>("faq:read", {
    queryKey: ["get-faq-list", params],
    queryFn: () => getFaqList(params),
    // 페이지·필터를 바꿔도 새 결과가 올 때까지 이전 목록을 그대로 둔다(표가 스켈레톤으로 깜빡이지 않는다).
    placeholderData: keepPreviousData,
  });
};
