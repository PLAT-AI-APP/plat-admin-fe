import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { AdminAuditLog, AuditResult } from "@/type/ops";

export interface AdminLogListParams {
  page: number;
  size: number;
  keyword?: string;
  domain?: string;
  result?: AuditResult | "";
  /** 특정 관리자의 활동만 본다. 관리자 관리 화면에서 넘어올 때 쓴다. */
  actorId?: string;
}

export const getAdminLogList = async (params: AdminLogListParams) => {
  const response = await adminAxios.get<PageResponse<AdminAuditLog>>(
    "/admin/logs/admin",
    { params },
  );

  return response.data;
};

/** 관리자 활동 로그를 도메인 · 결과 필터, 검색, 페이지네이션과 함께 조회합니다. */
export const useAdminLogListQuery = (params: AdminLogListParams) => {
  return useQuery<PageResponse<AdminAuditLog>, AppError>({
    queryKey: ["get-admin-log-list", params],
    queryFn: () => getAdminLogList(params),
  });
};
