import type { HealthStatus } from "./ops";

/**
 * 대시보드가 다루는 지표 축.
 *
 * 지표 카드와 추이 차트가 **같은 키를 쓴다.** 카드를 누르면 그 카드가 요약한
 * 계열이 그대로 차트에 그려지므로, 카드의 값은 언제나 그 계열의 마지막 점과 같다.
 */
export type DashboardMetricKey =
  | "newUsers"
  | "activeUsers"
  | "newUniverses"
  | "chatCount"
  | "paidAmount"
  | "creditUsed";

/** 일자별 추이 1포인트. 지표 키마다 그날의 값을 하나씩 가진다. */
export interface DashboardTrendPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
  /** 그날 등록된 세계관 수 */
  newUniverses: number;
  chatCount: number;
  paidAmount: number;
  /** 그날 소모된 크레딧 */
  creditUsed: number;
}

/** 지표 카드 1개 */
export interface DashboardMetric {
  /** 추이 계열 키. 카드를 누르면 이 계열이 차트에 그려진다. */
  key: DashboardMetricKey;
  label: string;
  value: number;
  /**
   * 전일 값.
   *
   * 증감률만으로는 모수를 알 수 없다. "+40%"가 5명에서 7명인지 5,000명에서
   * 7,000명인지에 따라 운영자가 할 일이 완전히 달라지므로 함께 내려준다.
   */
  previousValue: number;
  /** 전일 대비 증감률 (%) */
  deltaRate: number;
  /** 금액 지표는 원 단위로 표기한다. */
  unit: "COUNT" | "CURRENCY" | "CREDIT";
  /** COUNT 지표의 단위 명사 (명 · 개 · 건). 금액 · 크레딧은 단위가 정해져 있다. */
  countSuffix?: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  /**
   * 일자별 추이. **직전 기간 비교에 쓸 만큼 넉넉히 내려준다.**
   *
   * 화면이 30일을 그리면서 "직전 30일 대비"를 함께 적으려면 60일이 필요하다.
   * 기간을 화면에서 고르므로 구간을 서버가 자를 수 없다.
   */
  trend: DashboardTrendPoint[];
  /** 크레딧 사용처 분포 */
  creditUsage: { label: string; value: number }[];
  serverStatus: HealthStatus;
  pendingQnaCount: number;
}
