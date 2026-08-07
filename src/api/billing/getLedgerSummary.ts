import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { LedgerSummary } from "@/type/billing";

export const getLedgerSummary = async () => {
  const response = await adminAxios.get<LedgerSummary>("/admin/ledger/summary");

  return response.data;
};

/** 결제 장부 상단 요약 카드에서 누적 지표를 조회합니다. */
export const useLedgerSummaryQuery = () => {
  return useQuery<LedgerSummary, AppError>({
    queryKey: ["get-ledger-summary"],
    queryFn: getLedgerSummary,
  });
};
