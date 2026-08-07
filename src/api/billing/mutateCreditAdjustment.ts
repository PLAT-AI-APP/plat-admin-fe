import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CreditAdjustment, CreditAdjustmentFormValues } from "@/type/billing";
import { showAppToast } from "@/lib/toast";

export const createCreditAdjustment = async (
  values: CreditAdjustmentFormValues,
) => {
  const response = await adminAxios.post<CreditAdjustment>(
    "/admin/credits/adjustments",
    values,
  );

  return response.data;
};

/**
 * 크레딧 수동 지급·차감.
 * 잔액이 즉시 바뀌므로 조정 이력과 장부를 함께 무효화한다.
 */
export const useCreditAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<
    CreditAdjustment,
    AppError,
    CreditAdjustmentFormValues
  >({
    mutationFn: createCreditAdjustment,
    onSuccess: () => {
      showAppToast("success", "크레딧을 조정했습니다.");
      queryClient.invalidateQueries({ queryKey: ["get-credit-adjustment-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-adjustable-user-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-ledger-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-ledger-summary"] });
    },
  });

  return { createMutation };
};
