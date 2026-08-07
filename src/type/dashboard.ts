import type { HealthStatus } from "./ops";

/** 지표 카드 1개 */
export interface DashboardMetric {
  label: string;
  value: number;
  /** 전일 대비 증감률 (%) */
  deltaRate: number;
  /** 금액 지표는 원 단위로 표기한다. */
  unit: "COUNT" | "CURRENCY" | "CREDIT";
}

/** 일자별 추이 1포인트 */
export interface DashboardTrendPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
  chatCount: number;
  paidAmount: number;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  /** 크레딧 사용처 분포 */
  creditUsage: { label: string; value: number }[];
  serverStatus: HealthStatus;
  pendingReportCount: number;
  pendingQnaCount: number;
}
