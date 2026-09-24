import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { EarningHistory, Redemption, RewardRedemptionStatus } from "@/type/earning";
import {
  toEarningHistory,
  toRedemption,
  type EarningHistoryResponse,
  type RedemptionAdminResponse,
} from "./earningMapper";
import { earningQueryKeys } from "./queryKeys";

export interface RedemptionListParams {
  page: number;
  size: number;
  keyword?: string;
  status?: RewardRedemptionStatus | "";
}

export const getRedemptionList = async (
  params: RedemptionListParams,
): Promise<PageResponse<Redemption>> => {
  const response = await liveAxios.get<PageWith<RedemptionAdminResponse>>(
    "/admin/earnings/redemptions",
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
    content: response.data.content.map(toRedemption),
  });
};

/** 교환 요청 목록 */
export const useRedemptionListQuery = (params: RedemptionListParams) =>
  usePermittedQuery<PageResponse<Redemption>>("earning:read", {
    queryKey: earningQueryKeys.redemptionList(params),
    queryFn: () => getRedemptionList(params),
  });

/** 펼친 행에서만 부른다. 처리 내역은 신청 한 건의 이력이다. */
export const useRedemptionHistoriesQuery = (redemptionId: string) =>
  usePermittedQuery<EarningHistory[]>("earning:read", {
    queryKey: earningQueryKeys.redemptionHistories(redemptionId),
    queryFn: async () =>
      (
        await liveAxios.get<EarningHistoryResponse[]>(
          `/admin/earnings/redemptions/${redemptionId}/histories`,
        )
      ).data.map(toEarningHistory),
  });

/** 뱃지 폴링 주기. 처리 대기 알림과 같은 박자로 돈다. */
const PENDING_REFETCH_MS = 60_000;

/** 발송 대기 상품권 건수. 사이드바와 처리 대기 알림이 함께 본다. */
export const usePendingRedemptionCountQuery = () =>
  usePermittedQuery<number>("earning:read", {
    queryKey: earningQueryKeys.pendingRedemptionCount(),
    queryFn: async () =>
      (await liveAxios.get<{ count: number }>("/admin/earnings/redemptions/pending-count")).data.count,
    refetchInterval: PENDING_REFETCH_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
