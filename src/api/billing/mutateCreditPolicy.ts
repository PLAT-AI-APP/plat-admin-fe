import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CreditPolicy, CreditPolicyKey } from "@/type/billing";
import { showAppToast } from "@/lib/toast";

export interface CreditPolicyUpdateValues {
  /** 지급은 양수, 차감은 음수로 보낸다. */
  amount: number;
  isEnabled: boolean;
}

export const updateCreditPolicy = async (
  policyKey: CreditPolicyKey,
  values: CreditPolicyUpdateValues,
) => {
  const response = await adminAxios.put<CreditPolicy>(
    `/admin/credits/policies/${policyKey}`,
    values,
  );

  return response.data;
};

/** 정책 금액·활성 여부를 바꾼 뒤 목록을 갱신합니다. */
export const useCreditPolicyMutation = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation<
    CreditPolicy,
    AppError,
    { policyKey: CreditPolicyKey; values: CreditPolicyUpdateValues }
  >({
    mutationFn: ({ policyKey, values }) => updateCreditPolicy(policyKey, values),
    onSuccess: () => {
      showAppToast("success", "크레딧 정책을 변경했습니다.");
      queryClient.invalidateQueries({ queryKey: ["get-credit-policy-list"] });
    },
  });

  return { updateMutation };
};
