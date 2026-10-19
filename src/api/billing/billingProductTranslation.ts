import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type { BillingProductTranslation } from "@/type/billing";
import type { ServiceLanguage } from "@/type/language";

/** 번역을 둘 수 있는 언어. 한국어는 상품 원문이라 상품 수정에서 고친다(서버도 400). */
export type BillingProductTranslationLanguage = Exclude<ServiceLanguage, "KO">;

const translationsKey = (productId?: number) =>
  ["get-billing-product-translations", productId] as const;

export const getBillingProductTranslations = async (productId: number) => {
  const response = await liveAxios.get<BillingProductTranslation[]>(
    `/billing/products/${productId}/translations`,
  );

  return response.data;
};

/** 상품 하나의 언어별 상품명 · 설명. 한국어 원문도 함께 온다. */
export const useBillingProductTranslationsQuery = (productId?: number) =>
  useQuery<BillingProductTranslation[], AppError>({
    queryKey: translationsKey(productId),
    queryFn: () => getBillingProductTranslations(productId!),
    enabled: productId !== undefined,
  });

interface SaveVariables {
  productId: number;
  language: BillingProductTranslationLanguage;
  name: string;
  description: string;
}

interface DeleteVariables {
  productId: number;
  language: BillingProductTranslationLanguage;
}

/**
 * 번역 저장 · 삭제. 저장은 `billingProduct:write`, 삭제는 `billingProduct:delete` 다.
 * 지우면 그 언어 유저에게는 한국어 상품명 · 설명이 보인다.
 */
export const useBillingProductTranslationMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = (productId: number) =>
    queryClient.invalidateQueries({ queryKey: translationsKey(productId) });

  const saveMutation = useMutation<
    BillingProductTranslation[],
    AppError,
    SaveVariables
  >({
    mutationFn: async ({ productId, language, name, description }) =>
      (
        await liveAxios.put<BillingProductTranslation[]>(
          `/billing/products/${productId}/translations/${language}`,
          { name, description },
        )
      ).data,
    onSuccess: (translations, { productId }) => {
      showAppToast(
        "success",
        "번역을 저장했습니다. 결제 화면에 바로 반영됩니다.",
      );
      queryClient.setQueryData(translationsKey(productId), translations);
      void invalidate(productId);
    },
    onError: (error) => showErrorToast(error),
  });

  const deleteMutation = useMutation<void, AppError, DeleteVariables>({
    mutationFn: async ({ productId, language }) => {
      await liveAxios.delete(
        `/billing/products/${productId}/translations/${language}`,
      );
    },
    onSuccess: (_, { productId }) => {
      showAppToast(
        "success",
        "번역을 지웠습니다. 이 언어로는 한국어가 보입니다.",
      );
      void invalidate(productId);
    },
    onError: (error) => showErrorToast(error),
  });

  return { saveMutation, deleteMutation };
};
