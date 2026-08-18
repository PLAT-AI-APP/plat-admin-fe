import type {
  DashboardMetric,
  DashboardSummary,
  DashboardTrendPoint,
} from "@/type/dashboard";
import { qnaItems } from "./communication";
import { reports } from "./report";
import { daysAgo, randomInt } from "../utils";

/** 대시보드 추이 구간 (일) */
const TREND_DAYS = 30;

/**
 * 최근 30일 추이.
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

    const newUsers = Math.round(randomInt(seed * 3, 120, 460) * weekendBonus);
    const activeUsers = Math.round(
      randomInt(seed * 5, 3_200, 7_800) * weekendBonus,
    );
    const chatCount = Math.round(
      randomInt(seed * 7, 18_000, 52_000) * weekendBonus,
    );

    return {
      date: daysAgo(offset).slice(0, 10),
      newUsers,
      activeUsers,
      chatCount,
      // 결제는 1,000원 단위로 떨어지게 만들어 표기가 자연스럽도록 한다.
      paidAmount: randomInt(seed * 11, 420, 1_850) * 1_000,
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

/** 최근 30일 크레딧 사용량 합계 (지표 카드와 도넛 차트가 같은 값을 쓰도록 먼저 만든다.) */
export const dashboardCreditUsage: DashboardSummary["creditUsage"] = [
  { label: "캐릭터 대화", value: 486_200 },
  { label: "이미지 생성", value: 214_800 },
  { label: "음성 합성", value: 96_400 },
  { label: "세계관 생성", value: 58_300 },
  { label: "에셋 구매", value: 41_500 },
];

const totalCreditUsage = dashboardCreditUsage.reduce(
  (sum, item) => sum + item.value,
  0,
);

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "신규 가입 유저",
    value: latest.newUsers,
    deltaRate: calculateDeltaRate(latest.newUsers, previous.newUsers),
    unit: "COUNT",
  },
  {
    label: "활성 유저 (DAU)",
    value: latest.activeUsers,
    deltaRate: calculateDeltaRate(latest.activeUsers, previous.activeUsers),
    unit: "COUNT",
  },
  {
    label: "신규 캐릭터",
    value: randomInt(101, 24, 96),
    deltaRate: calculateDeltaRate(randomInt(101, 24, 96), randomInt(102, 24, 96)),
    unit: "COUNT",
  },
  {
    label: "총 대화 수",
    value: latest.chatCount,
    deltaRate: calculateDeltaRate(latest.chatCount, previous.chatCount),
    unit: "COUNT",
  },
  {
    label: "결제 금액",
    value: latest.paidAmount,
    deltaRate: calculateDeltaRate(latest.paidAmount, previous.paidAmount),
    unit: "CURRENCY",
  },
  {
    label: "크레딧 사용량 (30일)",
    value: totalCreditUsage,
    deltaRate: calculateDeltaRate(randomInt(201, 30, 60), randomInt(202, 30, 60)),
    unit: "CREDIT",
  },
];

/**
 * 대시보드 요약.
 * 대기 건수는 다른 도메인 목업과 어긋나지 않도록 실제 시드 배열에서 계산한다.
 */
export const dashboardSummary: DashboardSummary = {
  metrics: dashboardMetrics,
  trend: dashboardTrend,
  creditUsage: dashboardCreditUsage,
  serverStatus: "UP",
  pendingReportCount: reports.filter(
    (report) => report.status === "PENDING" || report.status === "REVIEWING",
  ).length,
  pendingQnaCount: qnaItems.filter((qna) => qna.status === "OPEN").length,
};
