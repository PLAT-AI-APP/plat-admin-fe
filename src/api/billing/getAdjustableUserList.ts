import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { AdjustableUser } from "@/type/user";

export interface AdjustableUserListParams {
  page: number;
  size: number;
  keyword?: string;
}

export const getAdjustableUserList = async (params: AdjustableUserListParams) => {
  const response = await adminAxios.get<PageResponse<AdjustableUser>>(
    "/admin/credits/users",
    { params },
  );

  return response.data;
};

/**
 * 크레딧 조정 대상 유저 검색.
 * 조정 화면에서 닉네임·이메일·유저 ID로 대상을 고를 때 사용합니다.
 */
export const useAdjustableUserListQuery = (
  params: AdjustableUserListParams,
  isEnabled = true,
) => {
  return useQuery<PageResponse<AdjustableUser>, AppError>({
    queryKey: ["get-adjustable-user-list", params],
    queryFn: () => getAdjustableUserList(params),
    enabled: isEnabled,
  });
};
