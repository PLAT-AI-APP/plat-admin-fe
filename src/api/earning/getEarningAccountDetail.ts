import { useInfiniteQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import { useHasPermission } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type {
  EarningAccountDetail,
  EarningAccrualRow,
  EarningContribution,
  EarningHistory,
  EarningLedgerRow,
  Redemption,
} from "@/type/earning";
import {
  toEarningAccountDetail,
  toEarningAccrualRow,
  toEarningContribution,
  toEarningHistory,
  toEarningLedgerRow,
  toRedemption,
  type EarningAccountDetailResponse,
  type EarningAccrualAdminResponse,
  type EarningContributionResponse,
  type EarningHistoryResponse,
  type EarningLedgerAdminResponse,
  type RedemptionAdminResponse,
} from "./earningMapper";
import { earningQueryKeys } from "./queryKeys";

/** 서버 SliceWith. 총 개수를 세지 않으므로 "더 보기"로 이어 받는다. */
interface SliceWith<T> {
  page: { number: number; size: number; numberOfElements: number; hasNext: boolean };
  content: T[];
}

export const EARNING_ACCOUNT_NOT_FOUND = "EARNING_ACCOUNT_NOT_FOUND";

/** 제작자 수익 계정 한 건 */
export const useEarningAccountQuery = (accountId: string) =>
  usePermittedQuery<EarningAccountDetail>("earning:read", {
    queryKey: earningQueryKeys.account(accountId),
    queryFn: async () =>
      toEarningAccountDetail(
        (await liveAxios.get<EarningAccountDetailResponse>(`/admin/earnings/accounts/${accountId}`)).data,
      ),
  });

/**
 * 유저 상세의 수익 탭. 대화 수익이 한 번도 없던 유저는 계정이 없어 404가 온다 —
 * 오류가 아니라 "계정 없음"이므로 다시 시도하지 않는다.
 */
export const useEarningAccountByUserQuery = (userId: string) =>
  usePermittedQuery<EarningAccountDetail>("earning:read", {
    queryKey: earningQueryKeys.accountByUser(userId),
    queryFn: async () =>
      toEarningAccountDetail(
        (await liveAxios.get<EarningAccountDetailResponse>(`/admin/earnings/users/${userId}`)).data,
      ),
    retry: (count, error) => error.code !== EARNING_ACCOUNT_NOT_FOUND && count < 1,
  });

/** 최근 30일 대화한 사용자별 기여 */
export const useEarningContributionsQuery = (accountId: string) =>
  usePermittedQuery<EarningContribution[]>("earning:read", {
    queryKey: earningQueryKeys.contributions(accountId),
    queryFn: async () =>
      (
        await liveAxios.get<EarningContributionResponse[]>(
          `/admin/earnings/accounts/${accountId}/contributions`,
        )
      ).data.map(toEarningContribution),
  });

const useEarningSliceQuery = <R, T>(
  queryKey: readonly unknown[],
  path: string,
  size: number,
  map: (row: R) => T,
  enabled = true,
) => {
  const allowed = useHasPermission("earning:read");

  return useInfiniteQuery<SliceWith<T>, AppError>({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await liveAxios.get<SliceWith<R>>(path, {
        params: { page: pageParam, size },
      });
      return { ...response.data, content: response.data.content.map(map) };
    },
    getNextPageParam: (last) => (last.page.hasNext ? last.page.number + 1 : undefined),
    enabled: enabled && allowed,
  });
};

/** 포인트 원장. 추가만 되는 기록이라 최신순으로 이어 받는다. */
export const useEarningLedgersQuery = (accountId: string, size = 20, enabled = true) =>
  useEarningSliceQuery<EarningLedgerAdminResponse, EarningLedgerRow>(
    earningQueryKeys.ledgers(accountId, size),
    `/admin/earnings/accounts/${accountId}/ledgers`,
    size,
    toEarningLedgerRow,
    enabled,
  );

/** 하루 단위 적립 */
export const useEarningAccrualsQuery = (accountId: string, size = 20) =>
  useEarningSliceQuery<EarningAccrualAdminResponse, EarningAccrualRow>(
    earningQueryKeys.accruals(accountId, size),
    `/admin/earnings/accounts/${accountId}/accruals`,
    size,
    toEarningAccrualRow,
  );

/** 계정·적립·교환에 남은 조치 이력 */
export const useEarningHistoriesQuery = (accountId: string, enabled = true) =>
  usePermittedQuery<EarningHistory[]>("earning:read", {
    queryKey: earningQueryKeys.histories(accountId),
    queryFn: async () =>
      (
        await liveAxios.get<EarningHistoryResponse[]>(`/admin/earnings/accounts/${accountId}/histories`)
      ).data.map(toEarningHistory),
    enabled,
  });

/** 이 계정의 교환 신청 */
export const useAccountRedemptionsQuery = (accountId: string, enabled = true) =>
  usePermittedQuery<Redemption[]>("earning:read", {
    queryKey: earningQueryKeys.accountRedemptions(accountId),
    queryFn: async () =>
      (
        await liveAxios.get<RedemptionAdminResponse[]>(`/admin/earnings/accounts/${accountId}/redemptions`)
      ).data.map(toRedemption),
    enabled,
  });
