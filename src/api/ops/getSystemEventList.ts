import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { SystemEventLog, SystemEventLevel } from "@/type/ops";

export interface SystemEventListParams {
  page: number;
  size: number;
  keyword?: string;
  level?: SystemEventLevel | "";
  source?: string;
}

export const getSystemEventList = async (params: SystemEventListParams) => {
  const response = await adminAxios.get<PageResponse<SystemEventLog>>(
    "/admin/logs/system",
    { params },
  );

  return response.data;
};

/**
 * 시스템 이벤트를 조회합니다.
 *
 * 장애를 보려고 여는 화면이라 캐시를 짧게 잡습니다. 5분 전 목록을 보여 주면
 * "방금 터진 것이 아직 안 올라왔나"와 "정말 조용한가"를 구분할 수 없습니다.
 */
export const useSystemEventListQuery = (params: SystemEventListParams) => {
  return useQuery<PageResponse<SystemEventLog>, AppError>({
    queryKey: ["get-system-event-list", params],
    queryFn: () => getSystemEventList(params),
    staleTime: 0,
  });
};
