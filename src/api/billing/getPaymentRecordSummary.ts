import { adminAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import type { PaymentRecordSummary } from "@/type/billing";

export const getPaymentRecordSummary = async () => {
  const response = await adminAxios.get<PaymentRecordSummary>(
    "/admin/payment-records/summary",
  );

  return response.data;
};

/** 보존 원장 상단 지표(보존 건수 · 탈퇴 회원 건 · 만료 임박 · 순 승인금액)를 조회합니다. */
export const usePaymentRecordSummaryQuery = () => {
  return usePermittedQuery<PaymentRecordSummary>("paymentRecord:read", {
    queryKey: ["get-payment-record-summary"],
    queryFn: getPaymentRecordSummary,
  });
};
