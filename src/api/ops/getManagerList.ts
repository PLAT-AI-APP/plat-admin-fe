import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Manager, ManagerStatus } from "@/type/ops";

export interface ManagerListParams {
  keyword?: string;
  status?: ManagerStatus | "";
  /** 직책 필터. 빈 문자열이 "전체"다. */
  roleId?: string;
}

export const getManagerList = async (params: ManagerListParams = {}) => {
  const response = await adminAxios.get<Manager[]>("/admin/managers", {
    params,
  });

  return response.data;
};

/**
 * 관리자 목록.
 *
 * 관리자는 많아도 수십 명이라 페이지네이션을 두지 않는다.
 * 검색·필터는 서버가 처리해 목록 화면과 조건이 어긋나지 않게 한다.
 */
export const useManagerListQuery = (params: ManagerListParams = {}) => {
  return useQuery<Manager[], AppError>({
    queryKey: ["get-manager-list", params],
    queryFn: () => getManagerList(params),
  });
};
