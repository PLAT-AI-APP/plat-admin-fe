import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
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

export const updateBannerOrder = async (bannerIds: number[]) => {
  const response = await adminAxios.put<Banner[]>("/admin/main/banners/order", {
    bannerIds,
  });

  return response.data;
};

/** 배너 추가·수정·삭제·정렬 후 목록을 갱신합니다. */
export const useBannerMutation = () => {
  const queryClient = useQueryClient();

  const invalidateBannerList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-banner-list"] });

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

  const orderMutation = useMutation<Banner[], AppError, number[]>({
    mutationFn: updateBannerOrder,
    onSuccess: () => {
      showAppToast("success", "배너 순서를 저장했습니다.");
      invalidateBannerList();
    },
  });

  return { createMutation, updateMutation, deleteMutation, orderMutation };
};
