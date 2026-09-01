import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { Banner, BannerFormValues } from "@/type/mainExposure";
import type { ServiceLanguage } from "@/type/language";
import { showAppToast } from "@/lib/toast";
import { toBanner, type BannerResponse } from "./getBannerList";

/** 저장 요청 본문. 빈 링크는 보내지 않는다 — 서버도 "링크 없음"과 구분하지 않는다. */
const toRequestBody = (values: BannerFormValues) => ({
  language: values.language,
  name: values.name,
  imageFileId: values.imageFileId,
  linkUrl: values.linkUrl ?? null,
  isActive: values.isActive,
  startDate: values.startDate ?? null,
  endDate: values.endDate ?? null,
});

export const createBanner = async (values: BannerFormValues) => {
  const response = await liveAxios.post<BannerResponse>(
    "/admin/main-banners",
    toRequestBody(values),
  );

  return toBanner(response.data);
};

export const updateBanner = async (
  bannerId: string,
  values: BannerFormValues,
) => {
  const response = await liveAxios.put<BannerResponse>(
    `/admin/main-banners/${bannerId}`,
    toRequestBody(values),
  );

  return toBanner(response.data);
};

export const deleteBanner = async (bannerId: string) => {
  await liveAxios.delete(`/admin/main-banners/${bannerId}`);
};

/**
 * 순서는 언어별로 매긴다.
 *
 * **그 언어의 배너 전체를 보내야 한다.** 일부만 보내면 서버가 나머지 자리를
 * 짐작해야 하고, 개수가 어긋나면 400으로 거절된다.
 */
export const updateBannerOrder = async (
  language: ServiceLanguage,
  bannerIds: string[],
) => {
  await liveAxios.patch("/admin/main-banners/order", {
    language,
    orderedIds: bannerIds,
  });
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
    { bannerId: string; values: BannerFormValues }
  >({
    mutationFn: ({ bannerId, values }) => updateBanner(bannerId, values),
    onSuccess: () => {
      showAppToast("success", "배너를 수정했습니다.");
      invalidateBannerList();
    },
  });

  const deleteMutation = useMutation<void, AppError, string>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      showAppToast("success", "배너를 삭제했습니다.");
      invalidateBannerList();
    },
  });

  const orderMutation = useMutation<
    void,
    AppError,
    { language: ServiceLanguage; bannerIds: string[] }
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
