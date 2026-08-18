import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { LedgerEntry, LedgerType } from "@/type/billing";

export interface LedgerListParams {
  page: number;
  size: number;
  keyword?: string;
  type?: LedgerType | "";
  /** YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  /** 특정 유저의 장부만 조회한다. (유저 상세에서 사용) */
  userId?: number;
}

export const getLedgerList = async (params: LedgerListParams) => {
  const response = await adminAxios.get<PageResponse<LedgerEntry>>(
    "/admin/ledger",
    { params },
  );

  return response.data;
};

/** 결제 장부를 유형·기간·검색어 필터와 함께 조회합니다. */
export const useLedgerListQuery = (params: LedgerListParams) => {
  return useQuery<PageResponse<LedgerEntry>, AppError>({
    queryKey: ["get-ledger-list", params],
    queryFn: () => getLedgerList(params),
  });
};
