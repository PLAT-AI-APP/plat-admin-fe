import { liveAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import type { AdminRole } from "@/type/ops";

export const getAdminRoleList = async () => {
  const response = await liveAxios.get<AdminRole[]>("/admin/roles");

  return response.data;
};

/** 직책 목록. 관리자 계정 폼과 직책 설정 화면이 함께 쓴다. */
export const useAdminRoleListQuery = () => {
  return usePermittedQuery<AdminRole[]>("role:read", {
    queryKey: ["get-admin-role-list"],
    queryFn: getAdminRoleList,
  });
};
