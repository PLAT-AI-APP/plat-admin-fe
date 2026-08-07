import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { AdjustmentType, CreditAdjustment } from "@/type/billing";

export interface CreditAdjustmentListParams {
  page: number;
  size: number;
  keyword?: string;
  type?: AdjustmentType | "";
}

export const getCreditAdjustmentList = async (
  params: CreditAdjustmentListParams,
) => {
  const response = await adminAxios.get<PageResponse<CreditAdjustment>>(
    "/admin/credits/adjustments",
    { params },
  );

  return response.data;
};

/** 크레딧 수동 조정 이력을 검색·필터·페이지네이션과 함께 조회합니다. */
export const useCreditAdjustmentListQuery = (
  params: CreditAdjustmentListParams,
) => {
  return useQuery<PageResponse<CreditAdjustment>, AppError>({
    queryKey: ["get-credit-adjustment-list", params],
    queryFn: () => getCreditAdjustmentList(params),
  });
};
