import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { LedgerSummary } from "@/type/billing";

export const getLedgerSummary = async () => {
  const response = await liveAxios.get<LedgerSummary>(
    "/admin/ledgers/summary",
  );

  return response.data;
};

/**
 * 결제 장부 상단 누적 카드.
 *
 * **목록 필터를 타지 않는 전체 누적이다.** 기간·유형으로 목록을 좁혀도 이 값은
 * 그대로다 — 검색 조건에 따라 흔들리면 지표로 쓸 수 없기 때문이다.
 */
export const useLedgerSummaryQuery = () => {
  return useQuery<LedgerSummary, AppError>({
    queryKey: ["get-ledger-summary"],
    queryFn: getLedgerSummary,
  });
};
