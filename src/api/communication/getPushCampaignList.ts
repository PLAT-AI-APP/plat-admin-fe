import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { PushCampaign, PushStatus } from "@/type/communication";

export interface PushCampaignListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열은 전체 조회를 의미한다. */
  status?: PushStatus | "";
}

export const getPushCampaignList = async (params: PushCampaignListParams) => {
  const response = await adminAxios.get<PageResponse<PushCampaign>>(
    "/admin/push/campaigns",
    { params },
  );

  return response.data;
};

/** 푸시 캠페인 목록 화면에서 검색·상태 필터·페이지네이션과 함께 사용합니다. */
export const usePushCampaignListQuery = (params: PushCampaignListParams) => {
  return useQuery<PageResponse<PushCampaign>, AppError>({
    queryKey: ["get-push-campaign-list", params],
    queryFn: () => getPushCampaignList(params),
  });
};
