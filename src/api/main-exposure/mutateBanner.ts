import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";
import { showAppToast } from "@/lib/toast";

export const createBanner = async (values: BannerFormValues) => {
  const response = await adminAxios.post<Banner>("/admin/main/banners", values);

  return response.data;
};

export const updateBanner = async (
  bannerId: number,
  values: BannerFormValues,
) => {
  const response = await adminAxios.put<Banner>(
    `/admin/main/banners/${bannerId}`,
    values,
  );

  return response.data;
};

export const deleteBanner = async (bannerId: number) => {
  await adminAxios.delete(`/admin/main/banners/${bannerId}`);
};

/** 순서는 언어별로 매긴다. 어느 언어의 캐러셀을 재배열하는지 함께 보낸다. */
export const updateBannerOrder = async (
  language: ServiceLanguage,
  bannerIds: number[],
) => {
  const response = await adminAxios.put<Banner[]>(
    "/admin/main/banners/order",
    { bannerIds },
    { params: { language } },
  );

  return response.data;
};

/** 배너 추가·수정·삭제·정렬 후 목록을 갱신합니다. */
export const useBannerMutation = () => {
  const queryClient = useQueryClient();

  /*
    목록 캐시는 언어별로 나뉘어 있다. 배너의 언어를 바꿔 저장하면 이전 언어와
    새 언어 두 목록이 함께 달라지므로, 언어를 가리지 않고 전부 무효화한다.
    탭 숫자(언어별 건수)도 같은 이유로 함께 다시 받는다.
  */
  const invalidateBannerList = () => {
    queryClient.invalidateQueries({ queryKey: ["get-banner-list"] });
    queryClient.invalidateQueries({
      queryKey: ["get-banner-language-counts"],
    });
  };

  const createMutation = useMutation<Banner, AppError, BannerFormValues>({
    mutationFn: createBanner,
    onSuccess: () => {
      showAppToast("success", "배너를 추가했습니다.");
      invalidateBannerList();
    },
  });

  const updateMutation = useMutation<
    Banner,
    AppError,
    { bannerId: number; values: BannerFormValues }
  >({
    mutationFn: ({ bannerId, values }) => updateBanner(bannerId, values),
    onSuccess: () => {
      showAppToast("success", "배너를 수정했습니다.");
      invalidateBannerList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      showAppToast("success", "배너를 삭제했습니다.");
      invalidateBannerList();
    },
  });

  const orderMutation = useMutation<
    Banner[],
    AppError,
    { language: ServiceLanguage; bannerIds: number[] }
  >({
    mutationFn: ({ language, bannerIds }) =>
      updateBannerOrder(language, bannerIds),
    onSuccess: () => {
      showAppToast("success", "배너 순서를 저장했습니다.");
      invalidateBannerList();
    },
  });

  return { createMutation, updateMutation, deleteMutation, orderMutation };
};
