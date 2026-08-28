import type { BatchRunStatus, BatchTrigger } from "@/type/ops";
import type { BadgeTone, SelectOption } from "@/components/ui";

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
 */
export const describeCron = (expression: string): string | undefined => {
  const [, minute, hour, dayOfMonth, month, dayOfWeek] = expression.split(" ");

  if ([dayOfMonth, month, dayOfWeek].some((field) => field !== "*")) return;

  if (hour === "*" && minute?.startsWith("*/")) {
    return `${minute.slice(2)}분마다`;
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
