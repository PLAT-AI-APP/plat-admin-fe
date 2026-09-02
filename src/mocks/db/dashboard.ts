import type {
  DashboardMetric,
  DashboardMetricKey,
  DashboardSummary,
  DashboardTrendPoint,
} from "@/type/dashboard";
import { qnaItems } from "./communication";
import { daysAgo, randomInt } from "../utils";

/**
 * 대시보드 추이 구간 (일).
 *
 * 화면이 그리는 최대 구간은 30일이지만 그 두 배를 만든다. "직전 30일 대비"를
 * 적으려면 앞선 30일이 있어야 하고, 구간은 화면에서 고르므로 여기서 자를 수 없다.
 */
const TREND_DAYS = 60;

/** 화면이 기본으로 그리는 구간. 크레딧 사용처 합계도 이 구간을 따른다. */
export const DASHBOARD_TREND_WINDOW = 30;

/**
 * 최근 60일 추이.
 * 실행마다 값이 바뀌면 화면 확인이 어려우므로 seed 기반 난수만 사용한다.
 */
export const dashboardTrend: DashboardTrendPoint[] = Array.from(
  { length: TREND_DAYS },
  (_, index) => {
    const seed = index + 1;
    // 배열 앞쪽이 과거, 뒤쪽이 최신이 되도록 역순으로 날짜를 만든다.
    const offset = TREND_DAYS - 1 - index;
    // 주말에 트래픽이 조금 더 오르는 패턴을 흉내 낸다.
    const isWeekendish = index % 7 === 5 || index % 7 === 6;
    const weekendBonus = isWeekendish ? 1.25 : 1;

    /*
      뒤로 갈수록 조금씩 커지는 성장 계수.
      값이 구간 내내 평평하면 "추이를 본다"는 화면의 목적이 확인되지 않는다.
    */
    const growth = 1 + (index / TREND_DAYS) * 0.35;
    const scale = weekendBonus * growth;

    const newUsers = Math.round(randomInt(seed * 3, 120, 460) * scale);
    const activeUsers = Math.round(randomInt(seed * 5, 3_200, 7_800) * scale);
    const chatCount = Math.round(randomInt(seed * 7, 18_000, 52_000) * scale);

    return {
      date: daysAgo(offset).slice(0, 10),
      newUsers,
      activeUsers,
      newUniverses: Math.round(randomInt(seed * 13, 24, 96) * scale),
      chatCount,
      // 결제는 1,000원 단위로 떨어지게 만들어 표기가 자연스럽도록 한다.
      paidAmount: Math.round(randomInt(seed * 11, 420, 1_850) * scale) * 1_000,
      creditUsed: Math.round(randomInt(seed * 17, 22_000, 46_000) * scale),
    };
  },
);

/** 전일 대비 증감률(%)을 소수 첫째 자리까지 계산한다. */
const calculateDeltaRate = (today: number, yesterday: number): number => {
  if (yesterday === 0) return 0;

  return Math.round(((today - yesterday) / yesterday) * 1_000) / 10;
};

const latest = dashboardTrend[dashboardTrend.length - 1];
const previous = dashboardTrend[dashboardTrend.length - 2];

/** 카드 정의. 값·전일값·증감률은 전부 추이 계열에서 뽑아 화면과 어긋나지 않게 한다. */
const METRIC_SPECS: Pick<
  DashboardMetric,
  "key" | "label" | "unit" | "countSuffix"
>[] = [
  {
    key: "newUsers",
    label: "신규 가입 유저",
    unit: "COUNT",
    countSuffix: "명",
  },
  {
    key: "activeUsers",
    label: "활성 유저 (DAU)",
    unit: "COUNT",
    countSuffix: "명",
  },
  {
    key: "newUniverses",
    label: "신규 세계관",
    unit: "COUNT",
    countSuffix: "개",
  },
  { key: "chatCount", label: "총 대화 수", unit: "COUNT", countSuffix: "건" },
  { key: "paidAmount", label: "결제 금액", unit: "CURRENCY" },
  { key: "creditUsed", label: "크레딧 사용량", unit: "CREDIT" },
];

export const dashboardMetrics: DashboardMetric[] = METRIC_SPECS.map((spec) => ({
  ...spec,
  value: latest[spec.key],
  previousValue: previous[spec.key],
  deltaRate: calculateDeltaRate(latest[spec.key], previous[spec.key]),
}));

/** 최근 30일 합계. 사용처 도넛이 추이의 크레딧 계열과 같은 총량을 쓰게 한다. */
const sumRecent = (key: DashboardMetricKey) =>
  dashboardTrend
    .slice(-DASHBOARD_TREND_WINDOW)
    .reduce((sum, point) => sum + point[key], 0);

const recentCreditUsed = sumRecent("creditUsed");

/**
 * 크레딧 사용처 분포.
 *
 * 비율만 정해 두고 총량은 추이에서 가져온다. 도넛의 합계와 "크레딧 사용량"
 * 카드가 다른 수를 말하면 어느 쪽이 맞는지 확인하는 데 시간이 든다.
 */
const CREDIT_USAGE_SHARES: { label: string; share: number }[] = [
  { label: "세계관 대화", share: 0.54 },
  { label: "이미지 생성", share: 0.24 },
  { label: "음성 합성", share: 0.11 },
  { label: "세계관 생성", share: 0.07 },
  { label: "에셋 구매", share: 0.04 },
];

export const dashboardCreditUsage: DashboardSummary["creditUsage"] =
  CREDIT_USAGE_SHARES.map(({ label, share }) => ({
    label,
    value: Math.round(recentCreditUsed * share),
  }));

/**
 * 대시보드 요약.
 * 대기 건수는 다른 도메인 목업과 어긋나지 않도록 실제 시드 배열에서 계산한다.
 *
 * 세계관 심사 대기 건수는 여기 없다. 세계관 목록은 이미 실서버로 나가므로
 * 화면이 `/admin/universes`를 직접 세고, 목업이 그와 다른 수를 말하지 않게 한다.
 */
export const dashboardSummary: DashboardSummary = {
  metrics: dashboardMetrics,
  trend: dashboardTrend,
  creditUsage: dashboardCreditUsage,
  serverStatus: "UP",
  pendingQnaCount: qnaItems.filter((qna) => qna.status === "OPEN").length,
};
