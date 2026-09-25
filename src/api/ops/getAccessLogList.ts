import { useQuery } from "@tanstack/react-query";
import dayjs from "@/lib/dayjs";
import { liveAxios } from "..";
import {
  toPageRequest,
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { AccessLog, AccessLogApp } from "@/type/ops";

/** 상태 코드 구간. 화면은 백 단위로만 고른다. */
export type AccessLogStatusClass = "2xx" | "3xx" | "4xx" | "5xx";

export interface AccessLogListParams {
  page: number;
  size: number;
  keyword?: string;
  app?: AccessLogApp | "";
  method?: string;
  status?: AccessLogStatusClass | "";
  userId?: string;
  /** `YYYY-MM-DD`. 브라우저 시간대의 하루로 보고 시각 구간으로 바꿔 보낸다. */
  startDate?: string;
  endDate?: string;
}

/** 서버는 없는 값을 `null`로 내려준다. 화면 타입은 `undefined`로 통일한다. */
type NullableKey =
  | "queryString"
  | "userId"
  | "requestBody"
  | "responseBody"
  | "remoteIp"
  | "userAgent";

type AccessLogResponse = Omit<AccessLog, NullableKey> & {
  [K in NullableKey]: string | null;
};

const toAccessLog = (log: AccessLogResponse): AccessLog => ({
  ...log,
  queryString: log.queryString ?? undefined,
  userId: log.userId ?? undefined,
  requestBody: log.requestBody ?? undefined,
  responseBody: log.responseBody ?? undefined,
  remoteIp: log.remoteIp ?? undefined,
  userAgent: log.userAgent ?? undefined,
});

const STATUS_RANGE: Record<
  AccessLogStatusClass,
  { statusMin: number; statusMax: number }
> = {
  "2xx": { statusMin: 200, statusMax: 299 },
  "3xx": { statusMin: 300, statusMax: 399 },
  "4xx": { statusMin: 400, statusMax: 499 },
  "5xx": { statusMin: 500, statusMax: 599 },
};

/**
 * 서버는 기간을 `Instant`(UTC 시각)로 받는다. 화면의 날짜 하루를 그날 0시부터
 * 끝까지의 시각 구간으로 편다. 빈 필터는 보내지 않는다(enum 파싱 실패 방지).
 */
const toRequestParams = (params: AccessLogListParams) => ({
  ...toPageRequest(params),
  keyword: params.keyword?.trim() || undefined,
  app: params.app || undefined,
  method: params.method || undefined,
  userId: params.userId || undefined,
  ...(params.status ? STATUS_RANGE[params.status] : {}),
  from: params.startDate
    ? dayjs(params.startDate).startOf("day").toISOString()
    : undefined,
  to: params.endDate
    ? dayjs(params.endDate).endOf("day").toISOString()
    : undefined,
});

export const getAccessLogList = async (
  params: AccessLogListParams,
): Promise<PageResponse<AccessLog>> => {
  const response = await liveAxios.get<PageWith<AccessLogResponse>>(
    "/logs/history",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toAccessLog),
  });
};

/**
 * 접근 로그를 조회합니다.
 *
 * 문의를 받고 "방금 그 요청"을 찾으러 여는 화면이라 캐시를 두지 않습니다.
 */
export const useAccessLogListQuery = (params: AccessLogListParams) => {
  return useQuery<PageResponse<AccessLog>, AppError>({
    queryKey: ["get-access-log-list", params],
    queryFn: () => getAccessLogList(params),
    staleTime: 0,
  });
};
