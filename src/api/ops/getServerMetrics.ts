import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";

/**
 * 시간대별 자원 사용률 1포인트.
 *
 * `src/type/ops.ts`에는 서버 상태(ServerHealth)만 정의되어 있고 이 응답 타입은
 * 이 엔드포인트에서만 쓰이므로, 도메인 타입 파일을 건드리지 않고 여기에 둔다.
 */
export interface ServerMetricPoint {
  capturedAt: string;
  /** CPU 사용률 (%) */
  cpuUsage: number;
  /** 메모리 사용률 (%) */
  memoryUsage: number;
  requestCount: number;
  errorCount: number;
}

export const getServerMetrics = async () => {
  const response = await adminAxios.get<ServerMetricPoint[]>(
    "/admin/server/metrics",
  );

  return response.data;
};

/** 최근 24시간 CPU · 메모리 추이를 조회합니다. */
export const useServerMetricsQuery = () => {
  return useQuery<ServerMetricPoint[], AppError>({
    queryKey: ["get-server-metrics"],
    queryFn: getServerMetrics,
  });
};
