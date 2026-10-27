import { formatCredit, formatCurrency, formatWithCommas } from "@/lib/utils";
import type { DashboardMetric, DashboardMetricKey } from "@/type/dashboard";

/**
 * 지표 카드 · 추이 차트 · 툴팁이 함께 쓰는 표기 규칙.
 *
 * 카드를 누르면 같은 계열이 차트로 이어지므로, 같은 값이 두 자리에서 다르게
 * 적히면 안 된다. 단위 처리를 한 곳에 모아 둔다.
 */

/** 값 하나를 단위에 맞춰 적는다. */
export const formatMetricValue = (
  value: number,
  { unit, countSuffix }: Pick<DashboardMetric, "unit" | "countSuffix">,
): string => {
  if (unit === "CURRENCY") return formatCurrency(value);
  if (unit === "CREDIT") return formatCredit(value);

  return `${formatWithCommas(value)}${countSuffix ?? ""}`;
};

/** 소수 첫째 자리까지만 남기고 `.0`은 지운다. (7.0천 → 7천) */
const trimTenth = (value: number): string =>
  value.toFixed(1).replace(/\.0$/, "");

/**
 * 축 눈금용 축약 표기.
 *
 * 결제 금액은 하루치가 백만 단위라 콤마 표기로는 눈금이 축 폭을 넘는다.
 *
 * 서비스 화면의 {@link formatStatCount}를 쓰지 않는다. 그쪽은 만 단위부터
 * 소수를 버려서 10,500과 14,000이 **똑같이 "1만"** 이 된다. 카운트 하나를
 * 적을 때는 문제가 없지만 눈금은 여러 개가 나란히 서므로, 같은 라벨이 두 번
 * 찍히면 축을 읽을 수 없다. 그래서 여기서는 자릿수를 한 자리 더 남긴다.
 */
export const formatMetricAxis = (value: number): string => {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const size = Math.abs(rounded);

  if (size >= 100_000_000) return `${sign}${trimTenth(size / 100_000_000)}억`;
  if (size >= 10_000) return `${sign}${trimTenth(size / 10_000)}만`;
  if (size >= 1_000) return `${sign}${trimTenth(size / 1_000)}천`;

  return formatWithCommas(rounded);
};

/**
 * 합계가 의미 있는 지표.
 *
 * DAU는 매일 다시 세는 값이라 더하면 같은 사람을 여러 번 세게 된다.
 * 이런 지표는 구간 요약을 합계 대신 평균으로 적는다.
 */
const ADDITIVE_KEYS: DashboardMetricKey[] = [
  "newUsers",
  "newUniverses",
  "chatCount",
  "paidAmount",
  "creditUsed",
];

export const isAdditiveMetric = (key: DashboardMetricKey): boolean =>
  ADDITIVE_KEYS.includes(key);

/** 증감의 방향. 0은 어느 쪽도 아니다(색을 입히지 않는다). */
export type DeltaDirection = "UP" | "DOWN" | "FLAT";

export const resolveDelta = (value: number): DeltaDirection => {
  if (value > 0) return "UP";
  if (value < 0) return "DOWN";

  return "FLAT";
};

/** 증감률(%)을 계산한다. 기준이 0이면 비율을 말할 수 없다. */
export const deltaRateOf = (
  current: number,
  base: number,
): number | undefined => {
  if (base === 0) return undefined;

  return Math.round(((current - base) / base) * 1_000) / 10;
};

/** 부호가 붙은 증감량. 증감률 옆에 "얼마나"를 적는 데 쓴다. */
export const formatDeltaAmount = (
  diff: number,
  metric: Pick<DashboardMetric, "unit" | "countSuffix">,
): string => {
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";

  return `${sign}${formatMetricValue(Math.abs(diff), metric)}`;
};
