import { keepPreviousData } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  EarningAccountRow,
  EarningAccountStatus,
  EarningAccountTotals,
} from "@/type/earning";
import { toEarningAccountRow, type EarningAccountListResponse } from "./earningMapper";
import { earningQueryKeys } from "./queryKeys";

export interface EarningAccountListParams {
  page: number;
  size: number;
  keyword?: string;
  status?: EarningAccountStatus | "";
}

export const getEarningAccountList = async (
  params: EarningAccountListParams,
): Promise<PageResponse<EarningAccountRow>> => {
  const response = await liveAxios.get<PageWith<EarningAccountListResponse>>(
    "/earnings/accounts",
    {
      params: {
        ...toPageRequest(params),
        keyword: params.keyword?.trim() || undefined,
        status: params.status || undefined,
      },
    },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toEarningAccountRow),
  });
};

/** 제작자 수익 계정 목록 */
export const useEarningAccountListQuery = (params: EarningAccountListParams) =>
  usePermittedQuery<PageResponse<EarningAccountRow>>("earning:read", {
    queryKey: earningQueryKeys.accountList(params),
    queryFn: () => getEarningAccountList(params),
    // 페이지·필터를 바꿔도 새 결과가 올 때까지 이전 목록을 그대로 둔다(표가 스켈레톤으로 깜빡이지 않는다).
    placeholderData: keepPreviousData,
  });

/** 목록 위 합계. 필터와 무관하게 전체 계정 기준이다. */
export const useEarningAccountTotalsQuery = () =>
  usePermittedQuery<EarningAccountTotals>("earning:read", {
    queryKey: earningQueryKeys.accountTotals(),
    queryFn: async () =>
      (await liveAxios.get<EarningAccountTotals>("/earnings/accounts/totals")).data,
  });
