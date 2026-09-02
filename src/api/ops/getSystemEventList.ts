import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  SystemEventLevel,
  SystemEventLog,
  SystemEventSource,
} from "@/type/ops";

export interface SystemEventListParams {
  page: number;
  size: number;
  keyword?: string;
  level?: SystemEventLevel | "";
  source?: SystemEventSource | "";
}

/** 요청 밖(배치 등)에서 난 이벤트는 추적 키가 없어 서버가 `null`로 내려준다. */
interface SystemEventLogResponse extends Omit<SystemEventLog, "traceId"> {
  traceId: string | null;
}

const toSystemEventLog = (event: SystemEventLogResponse): SystemEventLog => ({
  ...event,
  traceId: event.traceId ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 보내지 않는다(enum 파싱 실패 방지). */
const toRequestParams = (params: SystemEventListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  level: params.level || undefined,
  source: params.source || undefined,
});

export const getSystemEventList = async (
  params: SystemEventListParams,
): Promise<PageResponse<SystemEventLog>> => {
  const response = await liveAxios.get<PageWith<SystemEventLogResponse>>(
    "/admin/logs/system",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toSystemEventLog),
  });
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
