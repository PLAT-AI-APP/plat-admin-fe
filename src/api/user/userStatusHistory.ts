import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { UserStatusHistory } from "@/type/user";

export interface UserStatusHistoryParams {
  userId: string;
  page: number;
  size: number;
}

export const getUserStatusHistories = async ({
  userId,
  ...params
}: UserStatusHistoryParams): Promise<PageResponse<UserStatusHistory>> => {
  const response = await liveAxios.get<PageWith<UserStatusHistory>>(
    `/users/${userId}/status-histories`,
    { params: toPageRequest(params) },
  );

  return toPageResponse(response.data);
};

/** 제재 이력. 유저 관리 · 신고 처리 · 자동 해제 · 본인 탈퇴로 바뀐 상태가 시간 역순으로 온다. */
export const useUserStatusHistoriesQuery = (params: UserStatusHistoryParams) =>
  usePermittedQuery<PageResponse<UserStatusHistory>>("user:read", {
    queryKey: ["get-user-status-histories", params],
    queryFn: () => getUserStatusHistories(params),
  });
