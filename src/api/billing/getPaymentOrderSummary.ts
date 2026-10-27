import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import type { PaymentOrderSummary } from "@/type/billing";

export const getPaymentOrderSummary = async (userId?: string) => {
  const response = await liveAxios.get<PaymentOrderSummary>(
    "/payment-orders/summary",
    { params: userId ? { userId } : undefined },
  );

  return response.data;
};

/**
 * 탭 옆 숫자와 상단 경고. 목록 조건과 무관하게 전체 기준이다.
 * `userId`를 주면 그 유저의 결제만 센다 — 유저 상세에서 처리할 일이 있는지 알려 줄 때 쓴다.
 */
export const usePaymentOrderSummaryQuery = (userId?: string) => {
  return usePermittedQuery<PaymentOrderSummary>("payment:read", {
    queryKey: ["get-payment-order-summary", userId ?? ""],
    queryFn: () => getPaymentOrderSummary(userId),
  });
};
