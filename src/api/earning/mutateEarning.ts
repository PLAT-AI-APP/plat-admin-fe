import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  EarningActionInput,
  EarningPolicyValues,
  RewardProductFormValues,
} from "@/type/earning";
import { earningQueryKeys } from "./queryKeys";

export type EarningAccountAction = "FREEZE" | "UNFREEZE" | "DEDUCT";

export interface EarningAccountActionInput extends EarningActionInput {
  accountId: string;
  action: EarningAccountAction;
  amount?: number;
}

const ACCOUNT_ACTION_PATH: Record<EarningAccountAction, string> = {
  FREEZE: "freeze",
  UNFREEZE: "unfreeze",
  DEDUCT: "deductions",
};

const ACCOUNT_ACTION_DONE: Record<EarningAccountAction, string> = {
  FREEZE: "계정을 동결했습니다.",
  UNFREEZE: "동결을 해제했습니다.",
  DEDUCT: "포인트를 차감했습니다.",
};

/** 잔액·원장·이력·교환 목록이 함께 바뀌므로 수익 캐시를 통째로 버린다. */
const useInvalidateEarning = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: earningQueryKeys.all() });
};

/** 계정 조치(동결·해제·차감). 모두 사유 코드와 메모가 필수다. */
export const useEarningAccountActionMutation = () => {
  const invalidate = useInvalidateEarning();

  return useMutation<void, AppError, EarningAccountActionInput>({
    mutationFn: async ({ accountId, action, reasonCode, memo, amount }) => {
      await liveAxios.post(
        `/earnings/accounts/${accountId}/${ACCOUNT_ACTION_PATH[action]}`,
        { reasonCode, memo, amount },
      );
    },
    onSuccess: (_, { action }) => {
      showAppToast("success", ACCOUNT_ACTION_DONE[action]);
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 상품권 발송 완료 · 반려 */
export const useRedemptionMutation = () => {
  const invalidate = useInvalidateEarning();

  const issueMutation = useMutation<void, AppError, { redemptionId: string; memo: string }>({
    mutationFn: async ({ redemptionId, memo }) => {
      await liveAxios.post(`/earnings/redemptions/${redemptionId}/issue`, {
        memo: memo || null,
      });
    },
    onSuccess: () => {
      showAppToast("success", "발송 처리했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  const rejectMutation = useMutation<void, AppError, { redemptionId: string; reason: string }>({
    mutationFn: async ({ redemptionId, reason }) => {
      await liveAxios.post(`/earnings/redemptions/${redemptionId}/reject`, { reason });
    },
    onSuccess: () => {
      showAppToast("success", "반려했습니다. 잠긴 포인트가 제작자에게 돌아갑니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  return { issueMutation, rejectMutation };
};

/** 새 정책을 한 줄 더한다. 이미 쌓인 적립은 당시 값이 그대로 남는다. */
export const useChangeEarningPolicyMutation = () => {
  const invalidate = useInvalidateEarning();

  return useMutation<void, AppError, EarningPolicyValues & { memo: string }>({
    mutationFn: async (body) => {
      await liveAxios.post("/earnings/policies", body);
    },
    onSuccess: () => {
      showAppToast("success", "새 정책을 적용했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });
};

/** 교환 상품 추가 · 수정 · 노출 · 삭제 */
export const useRewardProductMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: earningQueryKeys.rewardProducts() });

  const toBody = (values: RewardProductFormValues) => ({
    ...values,
    imageFileId: values.imageFileId || null,
  });

  const saveMutation = useMutation<
    void,
    AppError,
    { productId?: string; values: RewardProductFormValues }
  >({
    mutationFn: async ({ productId, values }) => {
      if (productId) {
        await liveAxios.put(`/reward-products/${productId}`, toBody(values));
      } else {
        await liveAxios.post("/reward-products", toBody(values));
      }
    },
    onSuccess: () => {
      showAppToast("success", "저장했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  const activeMutation = useMutation<void, AppError, { productId: string; active: boolean }>({
    mutationFn: async ({ productId, active }) => {
      await liveAxios.patch(`/reward-products/${productId}/active`, { active });
    },
    onSuccess: invalidate,
    onError: (error) => showErrorToast(error),
  });

  const deleteMutation = useMutation<void, AppError, string>({
    mutationFn: async (productId) => {
      await liveAxios.delete(`/reward-products/${productId}`);
    },
    onSuccess: () => {
      showAppToast("success", "삭제했습니다.");
      invalidate();
    },
    onError: (error) => showErrorToast(error),
  });

  return { saveMutation, activeMutation, deleteMutation };
};
