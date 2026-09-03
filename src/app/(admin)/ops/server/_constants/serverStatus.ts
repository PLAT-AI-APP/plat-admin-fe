import type { BadgeTone } from "@/components/ui/Badge";
import type { HealthStatus } from "@/type/ops";

/** 서버 상태 enum은 화면에 그대로 노출하지 않고 한국어로 옮긴다. */
export const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  UP: "정상",
  DEGRADED: "성능 저하",
  DOWN: "장애",
};

export const HEALTH_STATUS_TONE: Record<HealthStatus, BadgeTone> = {
  UP: "success",
  DEGRADED: "warning",
  DOWN: "danger",
};

/** 전체 상태별로 무엇을 확인하면 되는지 함께 안내한다. */
export const HEALTH_STATUS_DESCRIPTION: Record<HealthStatus, string> = {
  UP: "모든 의존성이 정상 응답하고 있습니다.",
  DEGRADED: "일부 지표가 임계치를 넘었거나 의존성 응답이 느립니다.",
  DOWN: "응답하지 않는 의존성이 있습니다. 즉시 확인이 필요합니다.",
};

/** 임계치. 80% 이상은 주의, 90% 이상은 위험으로 본다. 서버 판정과 같은 선이다. */
export const WARNING_THRESHOLD = 80;
export const DANGER_THRESHOLD = 90;

export type UsageTone = "normal" | "warning" | "danger";

export const getUsageTone = (value: number): UsageTone => {
  if (value >= DANGER_THRESHOLD) return "danger";
  if (value >= WARNING_THRESHOLD) return "warning";

  return "normal";
};

/** 임계치 색. 막대 · 게이지 · 수치가 같은 색을 쓰게 한 곳에서 정한다. */
export const USAGE_TONE_COLOR: Record<UsageTone, string> = {
  normal: "var(--brand)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export const USAGE_TONE_TEXT_CLASS: Record<UsageTone, string> = {
  normal: "text-font-0",
  warning: "text-warning",
  danger: "text-danger",
};

export const USAGE_TONE_BADGE: Record<UsageTone, BadgeTone> = {
  normal: "success",
  warning: "warning",
  danger: "danger",
};

/**
 * 구성 차트 슬라이스 색.
 *
 * 의미 색(success/danger)을 구성 조각에 쓰지 않는다 — "초록 = 정상"으로 읽히는
 * 자리에서 초록 조각이 나오면 크기가 아니라 색을 먼저 읽게 된다.
 */
export const SLICE_COLORS = [
  "var(--brand)",
  "var(--info)",
  "#8b5cf6",
  "#0ea5e9",
  "#f59e0b",
  "#14b8a6",
  "#ec4899",
  "#64748b",
] as const;

/** 도넛 지름. 게이지와 구성 차트가 같은 크기여야 카드끼리 눈높이가 맞는다. */
export const DONUT_SIZE = 168;

/** 남은 자리(free)는 항상 같은 회색이다. 색이 돌아가면 "남은 몫"으로 안 읽힌다. */
export const FREE_SLICE_COLOR = "var(--border-strong)";

const SECONDS_PER_DAY = 24 * 60 * 60;
const SECONDS_PER_HOUR = 60 * 60;

/** 초 단위 업타임을 사람이 읽는 형식(일/시/분)으로 바꾼다. */
export const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((uptimeSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((uptimeSeconds % SECONDS_PER_HOUR) / 60);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}일`);
  // 일 단위가 있으면 "17일 3분"처럼 시간이 빠져 보이지 않도록 0시간도 함께 적는다.
  if (hours > 0 || days > 0) parts.push(`${hours}시간`);
  parts.push(`${minutes}분`);

  return parts.join(" ");
};

/** 사용률을 소수점 한 자리로 자른다. 서버가 이미 반올림하지만 목업·계산값도 지나간다. */
export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
