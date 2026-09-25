import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { CreditBulkGrantResult } from "@/type/billing";

/**
 * 일괄 지급 요청.
 *
 * `idempotencyKey`는 묶음 키다. 서버가 유저마다 `키:userId`로 풀어 쓰므로
 * 실패한 유저만 다시 보낼 때도 **같은 키**를 보내야 이미 받은 유저가 두 번 받지 않는다.
 */
export interface CreditBulkGrantRequest {
  userIds: string[];
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export const createCreditBulkGrant = async (
  request: CreditBulkGrantRequest,
) => {
  const response = await liveAxios.post<CreditBulkGrantResult>(
    "/credits/adjustments/bulk",
    request,
  );

  return response.data;
};

/**
 * 크레딧 일괄 지급.
 *
 * 일부 실패도 200 이라 성공 토스트를 띄우지 않는다. 결과는 모달이 건수와 실패 목록으로 보여 준다.
 */
export const useCreditBulkGrantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreditBulkGrantResult, AppError, CreditBulkGrantRequest>({
    mutationFn: createCreditBulkGrant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-credit-adjustment-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-adjustable-user-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-ledger-list"] });
      queryClient.invalidateQueries({ queryKey: ["get-ledger-summary"] });
    },
  });
};
