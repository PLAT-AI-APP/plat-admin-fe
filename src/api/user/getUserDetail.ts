import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { UserDetail } from "@/type/user";

export const getUserDetail = async (userId: number) => {
  const response = await adminAxios.get<UserDetail>(`/admin/users/${userId}`);

  return response.data;
};

/**
 * 유저 상세 모달에서 사용합니다.
 * 모달이 닫혀 있을 때는 userId가 null이므로 조회하지 않습니다.
 */
export const useUserDetailQuery = (userId: number | null) => {
  return useQuery<UserDetail, AppError>({
    queryKey: ["get-user-detail", userId],
    queryFn: () => getUserDetail(userId!),
    enabled: userId !== null,
  });
};
