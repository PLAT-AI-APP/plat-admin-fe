import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { BillingProduct } from "@/type/billing";

export const getBillingProductList = async () => {
  const response = await liveAxios.get<BillingProduct[]>(
    "/admin/billing/products",
  );

  return response.data;
};

/** 상품/결제금액 관리 화면에서 노출 순서대로 상품을 조회합니다. */
export const useBillingProductListQuery = () => {
  return useQuery<BillingProduct[], AppError>({
    queryKey: ["get-billing-product-list"],
    queryFn: getBillingProductList,
  });
};
