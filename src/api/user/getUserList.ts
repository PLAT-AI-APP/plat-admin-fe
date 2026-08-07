import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { User, UserRole, UserStatus } from "@/type/user";

export interface UserListParams {
  page: number;
  size: number;
  keyword?: string;
  status?: UserStatus;
  role?: UserRole;
  /** "true" | "false" | undefined(전체) */
  isAdultVerified?: string;
}

export const getUserList = async (params: UserListParams) => {
  const response = await adminAxios.get<PageResponse<User>>("/admin/users", {
    params,
  });

  return response.data;
};

/** 유저 목록 화면에서 검색·상태/역할 필터·페이지네이션과 함께 사용합니다. */
export const useUserListQuery = (params: UserListParams) => {
  return useQuery<PageResponse<User>, AppError>({
    queryKey: ["get-user-list", params],
    queryFn: () => getUserList(params),
  });
};
