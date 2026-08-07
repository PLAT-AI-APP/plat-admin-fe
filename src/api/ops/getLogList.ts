import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { LogLevel, OperationLog } from "@/type/ops";

export interface LogListParams {
  page: number;
  size: number;
  keyword?: string;
  level?: LogLevel | "";
  domain?: string;
}

export const getLogList = async (params: LogListParams) => {
  const response = await adminAxios.get<PageResponse<OperationLog>>(
    "/admin/logs/recent",
    { params },
  );

  return response.data;
};

/** 로그 화면에서 레벨·도메인 필터, 검색, 페이지네이션과 함께 사용합니다. */
export const useLogListQuery = (params: LogListParams) => {
  return useQuery<PageResponse<OperationLog>, AppError>({
    queryKey: ["get-log-list", params],
    queryFn: () => getLogList(params),
  });
};
