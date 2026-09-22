import type { BatchRunStatus, BatchTrigger } from "@/type/ops";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

export const BATCH_RUN_STATUS_LABEL: Record<BatchRunStatus, string> = {
  RUNNING: "실행 중",
  SUCCESS: "성공",
  SKIPPED: "대상 없음",
  FAILED: "실패",
};

/**
 * `SKIPPED`는 성공과 다른 색으로 둔다.
 *
 * 처리할 대상이 없어 넘어간 것을 성공과 같은 초록으로 칠하면, 조건이 잘못되어
 * **매일 아무 일도 하지 않는 잡**이 정상으로 보인다.
 */
export const BATCH_RUN_STATUS_TONE: Record<BatchRunStatus, BadgeTone> = {
  RUNNING: "info",
  SUCCESS: "success",
  SKIPPED: "neutral",
  FAILED: "danger",
};

export const BATCH_RUN_STATUS_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...(Object.keys(BATCH_RUN_STATUS_LABEL) as BatchRunStatus[]).map(
    (status) => ({
      label: BATCH_RUN_STATUS_LABEL[status],
      value: status,
    }),
  ),
];

export const BATCH_TRIGGER_LABEL: Record<BatchTrigger, string> = {
  SCHEDULE: "스케줄",
  MANUAL: "수동",
};

export const BATCH_TRIGGER_OPTIONS: SelectOption[] = [
  { label: "전체 트리거", value: "" },
  ...(Object.keys(BATCH_TRIGGER_LABEL) as BatchTrigger[]).map((trigger) => ({
    label: BATCH_TRIGGER_LABEL[trigger],
    value: trigger,
  })),
];

/**
 * 크론식을 사람이 읽는 주기로 옮긴다.
 *
 * 크론식만 보여 주면 운영자는 이 잡이 하루에 한 번 도는지 30분마다 도는지
 * 알 수 없다. 아는 모양만 옮기고, 모르면 크론식을 그대로 보여 준다 —
 * 틀린 설명을 지어내는 것보다 원문이 낫다.
 *
 * 크론은 서버가 한국 시간 기준으로 돌린다. 표의 다른 시각(최근 실행 · 다음 예정)과
 * 같은 기준이라 그대로 옮겨 적으면 된다.
 */
export const describeCron = (expression: string): string | undefined => {
  const [, minute, hour, dayOfMonth, month, dayOfWeek] = expression.split(" ");

  if ([dayOfMonth, month, dayOfWeek].some((field) => field !== "*")) return;

  if (hour === "*" && minute?.startsWith("*/")) {
    return `${minute.slice(2)}분마다`;
  }

  /* 정각에만 도는 N시간 주기. 분이 0이 아니면 설명이 그 분을 잃으므로 옮기지 않는다. */
  if (hour?.startsWith("*/") && minute === "0") {
    return `${hour.slice(2)}시간마다`;
  }

  if (/^\d+$/.test(hour ?? "") && /^\d+$/.test(minute ?? "")) {
    return `매일 ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  return;
};

/** 소요 시간. ms를 그대로 보여 주면 3분과 30초를 한눈에 비교할 수 없다. */
export const formatDuration = (durationMs?: number): string => {
  if (durationMs === undefined) return "-";
  if (durationMs < 1_000) return `${durationMs}ms`;

  const seconds = Math.round(durationMs / 1_000);

  if (seconds < 60) return `${seconds}초`;

  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
};

/* ------------------------------------------------------------------ */
/* 분류                                                                 */
/* ------------------------------------------------------------------ */

export type BatchJobCategory =
  | "payment"
  | "credit"
  | "content"
  | "cleanup"
  | "etc";

/**
 * 잡을 묶는 갈래. **화면에서만 쓰는 분류다.**
 *
 * 서버는 잡에 분류를 붙이지 않는다. 잡이 스무 개 가까이 되면 한 줄로 늘어놓은 표에서
 * "결제 쪽 잡이 다 돌았나"를 보려면 이름을 하나씩 읽어야 해서, 화면이 jobKey로 갈래를 정한다.
 *
 * 무엇을 건드리는 잡인가로 나눈다. `purge-payment-data`처럼 지우는 잡이라도 결제 데이터를
 * 다루면 결제에 둔다 — 결제에 문제가 생겼을 때 함께 봐야 하는 잡이기 때문이다.
 * 기록 정리는 운영 기록(로그 · 이력 · 표본)만 지우는 잡이라 서비스에 닿지 않는다.
 */
export const BATCH_JOB_CATEGORY_LABEL: Record<BatchJobCategory, string> = {
  payment: "결제 · 환불",
  credit: "크레딧",
  content: "유저 · 콘텐츠",
  cleanup: "기록 정리",
  etc: "기타",
};

/** 탭과 `전체` 정렬에 쓰는 순서. 돈이 걸린 잡부터 둔다. */
export const BATCH_JOB_CATEGORY_ORDER: readonly BatchJobCategory[] = [
  "payment",
  "credit",
  "content",
  "cleanup",
  "etc",
];

const BATCH_JOB_CATEGORY_BY_KEY: Record<string, BatchJobCategory> = {
  "relay-payment-outbox": "payment",
  "reconcile-captured-orders": "payment",
  "confirm-in-doubt-payments": "payment",
  "resume-stale-refunds": "payment",
  "expire-pending-orders": "payment",
  "apply-pg-notifications": "payment",
  "purge-payment-data": "payment",

  "expire-credits": "credit",
  "cancel-expired-reservations": "credit",

  "release-expired-suspensions": "content",
  "purge-expired-files": "content",
  "purge-expired-drafts": "content",
  "purge-deleted-comments": "content",
  "refresh-stat-rankings": "content",

  "purge-admin-logs": "cleanup",
  "purge-admin-activity-logs": "cleanup",
  "purge-system-events": "cleanup",
  "purge-server-metrics": "cleanup",
  "purge-batch-runs": "cleanup",
};

/**
 * 잡의 갈래.
 *
 * 서버에 잡이 새로 생겨도 화면이 모르면 **`기타`로 떨어진다.** 목록에서 사라지면
 * 켜고 끌 수도 없게 되므로, 모르는 잡은 숨기지 않고 따로 모아 둔다.
 */
export const batchJobCategory = (jobKey: string): BatchJobCategory =>
  BATCH_JOB_CATEGORY_BY_KEY[jobKey] ?? "etc";
