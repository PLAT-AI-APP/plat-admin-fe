import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import type { EarningPolicy, EarningReconciliation, RewardProduct } from "@/type/earning";
import {
  toEarningPolicy,
  toEarningReconciliation,
  toRewardProduct,
  type EarningPolicyResponse,
  type EarningReconciliationResponse,
  type RewardProductAdminResponse,
} from "./earningMapper";
import { earningQueryKeys } from "./queryKeys";

/** 수익 정책 이력. 첫 줄이 현재 정책이다. */
export const useEarningPoliciesQuery = () =>
  usePermittedQuery<EarningPolicy[]>("earning:read", {
    queryKey: earningQueryKeys.policies(),
    queryFn: async () =>
      (await liveAxios.get<EarningPolicyResponse[]>("/earnings/policies")).data.map(
        toEarningPolicy,
      ),
  });

/** 교환 상품. 노출을 끈 상품까지 모두 온다. */
export const useRewardProductListQuery = () =>
  usePermittedQuery<RewardProduct[]>("rewardProduct:read", {
    queryKey: earningQueryKeys.rewardProducts(),
    queryFn: async () =>
      (await liveAxios.get<RewardProductAdminResponse[]>("/reward-products")).data.map(
        toRewardProduct,
      ),
  });

/** 최근 며칠의 대사 결과 */
export const useEarningReconciliationsQuery = (days = 7) =>
  usePermittedQuery<EarningReconciliation[]>("earning:read", {
    queryKey: earningQueryKeys.reconciliations(days),
    queryFn: async () =>
      (
        await liveAxios.get<EarningReconciliationResponse[]>("/earnings/reconciliations", {
          params: { days },
        })
      ).data.map(toEarningReconciliation),
  });
