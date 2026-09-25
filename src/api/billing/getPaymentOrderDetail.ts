import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import type { PaymentOrderDetail } from "@/type/billing";
import { toPaymentOrderDetail } from "./paymentOrderMapper";

export const getPaymentOrderDetail = async (orderId: string) => {
  const response = await liveAxios.get<unknown>(`/payment-orders/${orderId}`);

  return toPaymentOrderDetail(response.data);
};

/**
 * 결제 상세. 주문 · PG 호출 · 크레딧 원장 · 환불 · 이상을 한 번에 받는다.
 *
 * 판정 불가 · 환불 처리 중인 건은 배치가 상태를 바꾼다. 캐시를 들고 있으면 이미 끝난 건을
 * "확인 중"으로 보고 PG에 한 번 더 문의하게 된다.
 */
export const usePaymentOrderDetailQuery = (orderId: string) => {
  return usePermittedQuery<PaymentOrderDetail>("payment:read", {
    queryKey: ["get-payment-order-detail", orderId],
    queryFn: () => getPaymentOrderDetail(orderId),
    staleTime: 0,
  });
};
