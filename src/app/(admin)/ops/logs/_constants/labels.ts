import type { LogLevel } from "@/type/ops";
import type { BadgeTone, SelectOption } from "@/components/ui";

/**
 * 로그 화면 라벨 맵.
 * 서버 enum 값을 화면에 그대로 노출하지 않기 위해 여기서만 한국어로 옮긴다.
 */

export const LOG_LEVEL_LABEL: Record<LogLevel, string> = {
  INFO: "정보",
  WARN: "경고",
  ERROR: "오류",
};

export const LOG_LEVEL_TONE: Record<LogLevel, BadgeTone> = {
  INFO: "info",
  WARN: "warning",
  ERROR: "danger",
};

/** 빈 문자열은 전체 조회를 의미한다. */
export const LOG_LEVEL_OPTIONS: SelectOption[] = [
  { label: "전체 레벨", value: "" },
  ...(Object.keys(LOG_LEVEL_LABEL) as LogLevel[]).map((level) => ({
    label: LOG_LEVEL_LABEL[level],
    value: level,
  })),
];

/**
 * 로그 도메인.
 * `OperationLog.domain`은 서버에서 문자열로 내려오므로, 화면에서 아는 값만
 * 한국어로 옮기고 모르는 값은 원문을 그대로 보여 준다.
 */
export const LOG_DOMAINS = [
  "USER",
  "CHARACTER",
  "BILLING",
  "AI",
  "MAIN_EXPOSURE",
  "OPS",
] as const;

export type LogDomain = (typeof LOG_DOMAINS)[number];

export const LOG_DOMAIN_LABEL: Record<LogDomain, string> = {
  USER: "회원",
  CHARACTER: "캐릭터",
  BILLING: "결제 · 크레딧",
  AI: "AI",
  MAIN_EXPOSURE: "메인 노출",
  OPS: "운영",
};

export const LOG_DOMAIN_OPTIONS: SelectOption[] = [
  { label: "전체 도메인", value: "" },
  ...LOG_DOMAINS.map((domain) => ({
    label: LOG_DOMAIN_LABEL[domain],
    value: domain,
  })),
];

/** 화면이 모르는 도메인이 들어와도 빈칸이 되지 않게 원문으로 대체한다. */
export const getLogDomainLabel = (domain: string): string =>
  LOG_DOMAIN_LABEL[domain as LogDomain] ?? domain;
