import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";

/**
 * 시간대별 자원 사용률 1포인트.
 *
 * `src/type/ops.ts`에는 서버 상태(ServerHealth)만 정의되어 있고 이 응답 타입은
 * 이 엔드포인트에서만 쓰이므로, 도메인 타입 파일을 건드리지 않고 여기에 둔다.
 */
export interface ServerMetricPoint {
  capturedAt: string;
  /**
   * CPU 사용률 (%). **null이면 그 시간대에 표본이 없다** — 대개 배포로 서버가
   * 내려가 있던 구간이다. 0으로 채우면 "한가했다"로 읽혀 정반대가 되므로
   * 차트에서는 선을 끊어 그린다.
   */
  cpuUsage: number | null;
  /** 메모리 사용률 (%). null의 의미는 위와 같다. */
  memoryUsage: number | null;
  memoryUsedBytes: number | null;
  /**
   * JVM 힙 사용률 (%). null의 의미는 위와 같다.
   *
   * 머신 메모리와 따로 온다. 머신에 여유가 있어도 힙이 차면 GC가 돌기 시작하므로,
   * 느려진 시각을 되짚을 때 두 선을 겹쳐 봐야 원인이 어느 쪽인지 갈린다.
   */
  heapUsage: number | null;
  heapUsedBytes: number | null;
  /** 서버가 없었으면 처리한 요청도 없으므로 이쪽은 0이 맞다. */
  requestCount: number;
  errorCount: number;
}

export const getServerMetrics = async () => {
  const response = await liveAxios.get<ServerMetricPoint[]>(
    "/admin/server/metrics",
  );

  return response.data;
};

/**
 * 최근 24시간 CPU · 메모리 · JVM 힙 추이를 조회합니다.
 *
 * CPU · 메모리 · 힙은 서버가 1분마다 남긴 표본을 시간 단위로 묶은 값이고,
 * 요청 수 · 오류 수는 액세스 로그에서 셉니다. 같은 사실을 두 곳에 쌓지 않으려고
 * 수집 경로를 나눠 두었습니다.
 */
export const useServerMetricsQuery = () => {
  return useQuery<ServerMetricPoint[], AppError>({
    queryKey: ["get-server-metrics"],
    queryFn: getServerMetrics,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
