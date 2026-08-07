import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { PushCampaign, PushTarget } from "@/type/communication";
import { showAppToast } from "@/lib/toast";

/** 푸시 캠페인 생성 요청 본문 */
export interface PushCampaignFormValues {
  title: string;
  body: string;
  target: PushTarget;
  /** 값이 있으면 예약 발송, 없으면 임시 저장 상태로 만들어진다. */
  scheduledAt?: string;
}

export const createPushCampaign = async (values: PushCampaignFormValues) => {
  const response = await adminAxios.post<PushCampaign>(
    "/admin/push/campaigns",
    values,
  );

  return response.data;
};

export const sendPushCampaign = async (campaignId: number) => {
  const response = await adminAxios.post<PushCampaign>(
    `/admin/push/campaigns/${campaignId}/send`,
  );

  return response.data;
};

export const deletePushCampaign = async (campaignId: number) => {
  await adminAxios.delete(`/admin/push/campaigns/${campaignId}`);
};

/** 푸시 캠페인 생성·발송·삭제 후 목록을 갱신합니다. */
export const usePushCampaignMutation = () => {
  const queryClient = useQueryClient();

  const invalidateCampaignList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-push-campaign-list"] });

  const createMutation = useMutation<
    PushCampaign,
    AppError,
    PushCampaignFormValues
  >({
    mutationFn: createPushCampaign,
    onSuccess: (campaign) => {
      showAppToast(
        "success",
        campaign.status === "SCHEDULED"
          ? "푸시 캠페인을 예약했습니다."
          : "푸시 캠페인을 저장했습니다.",
      );
      invalidateCampaignList();
    },
  });

  const sendMutation = useMutation<PushCampaign, AppError, number>({
    mutationFn: sendPushCampaign,
    onSuccess: (campaign) => {
      showAppToast("success", "푸시를 발송했습니다.", {
        description: `${campaign.successCount.toLocaleString("ko-KR")}명에게 전달되었습니다.`,
      });
      invalidateCampaignList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deletePushCampaign,
    onSuccess: () => {
      showAppToast("success", "푸시 캠페인을 삭제했습니다.");
      invalidateCampaignList();
    },
  });

  return { createMutation, sendMutation, deleteMutation };
};
