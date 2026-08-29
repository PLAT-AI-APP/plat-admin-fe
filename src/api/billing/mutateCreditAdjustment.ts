import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { CreditAdjustment, CreditAdjustmentFormValues } from "@/type/billing";
import { showAppToast } from "@/lib/toast";

/**
 * 조정 실행 요청.
 *
 * `idempotencyKey`는 폼 값이 아니라 **모달이 쥐고 있는 값**이다. 폼을 고쳐 다시
 * 제출해도, 네트워크 오류로 재시도해도 같은 값이 나가야 두 번 반영되지 않는다.
 */
export interface CreditAdjustmentRequest extends CreditAdjustmentFormValues {
  idempotencyKey: string;
}

export const createCreditAdjustment = async (
  request: CreditAdjustmentRequest,
) => {
  const response = await liveAxios.post<CreditAdjustment>(
    "/admin/credits/adjustments",
    request,
  );

  return response.data;
};

/**
 * 크레딧 수동 지급·차감.
 *
 * 잔액이 즉시 바뀌므로 조정 이력과 장부, 그리고 **대상 유저 검색**을 함께
 * 무효화한다. 검색 결과에 잔액이 실려 있어, 무효화하지 않으면 방금 조정한
 * 유저를 다시 골랐을 때 옛 잔액을 기준으로 초과 차감을 판단하게 된다.
 *
 * 실패 문구는 서버가 준 것을 그대로 쓴다. 409(같은 멱등키로 이미 처리) ·
 * 422(회수 가능한 크레딧 부족) · 404(지갑 없음)가 각각 다른 뜻이라,
 * 화면이 하나로 뭉뚱그리면 운영자가 무엇을 고쳐야 할지 알 수 없다.
 */
export const useCreditAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<
    CreditAdjustment,
    AppError,
    CreditAdjustmentRequest
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
