import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  BillingProduct,
  BillingProductFormValues,
  ProductStatus,
} from "@/type/billing";
import { showAppToast } from "@/lib/toast";

export const createBillingProduct = async (values: BillingProductFormValues) => {
  const response = await adminAxios.post<BillingProduct>(
    "/admin/billing/products",
    values,
  );

  return response.data;
};

export const updateBillingProduct = async (
  productId: number,
  values: BillingProductFormValues,
) => {
  const response = await adminAxios.put<BillingProduct>(
    `/admin/billing/products/${productId}`,
    values,
  );

  return response.data;
};

export const updateBillingProductStatus = async (
  productId: number,
  status: ProductStatus,
) => {
  const response = await adminAxios.patch<BillingProduct>(
    `/admin/billing/products/${productId}/status`,
    { status },
  );

  return response.data;
};

/** 상품 생성·수정·노출 상태 변경 후 목록을 갱신합니다. */
export const useBillingProductMutation = () => {
  const queryClient = useQueryClient();

  const invalidateProductList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-billing-product-list"] });

  const createMutation = useMutation<
    BillingProduct,
    AppError,
    BillingProductFormValues
  >({
    mutationFn: createBillingProduct,
    onSuccess: () => {
      showAppToast("success", "상품을 추가했습니다.");
      invalidateProductList();
    },
  });

  const updateMutation = useMutation<
    BillingProduct,
    AppError,
    { productId: number; values: BillingProductFormValues }
  >({
    mutationFn: ({ productId, values }) => updateBillingProduct(productId, values),
    onSuccess: () => {
      showAppToast("success", "상품을 수정했습니다.");
      invalidateProductList();
    },
  });

  const statusMutation = useMutation<
    BillingProduct,
    AppError,
    { productId: number; status: ProductStatus }
  >({
    mutationFn: ({ productId, status }) =>
      updateBillingProductStatus(productId, status),
    onSuccess: () => {
      showAppToast("success", "상품 노출 상태를 변경했습니다.");
      invalidateProductList();
    },
  });

  return { createMutation, updateMutation, statusMutation };
};
