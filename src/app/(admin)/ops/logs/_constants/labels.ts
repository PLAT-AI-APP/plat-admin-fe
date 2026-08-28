import {
  LOG_DOMAINS,
  SYSTEM_EVENT_SOURCES,
  type AuditResult,
  type LogDomain,
  type SystemEventLevel,
  type SystemEventSource,
} from "@/type/ops";
import type { BadgeTone, SelectOption } from "@/components/ui";

/**
 * 로그 화면 라벨 맵.
 * 서버 enum 값을 화면에 그대로 노출하지 않기 위해 여기서만 한국어로 옮긴다.
 */

/* -------------------------------------------------------------------------
 * 관리자 활동 로그
 * ---------------------------------------------------------------------- */

export const LOG_DOMAIN_LABEL: Record<LogDomain, string> = {
  USER: "회원",
  CHARACTER: "캐릭터",
  COMMUNITY: "커뮤니티",
  BILLING: "결제 · 크레딧",
  AI: "AI",
  MAIN_EXPOSURE: "메인 노출",
  OPS: "운영",
};

/** 빈 문자열은 전체 조회를 의미한다. */
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

export const AUDIT_RESULT_LABEL: Record<AuditResult, string> = {
  SUCCESS: "성공",
  DENIED: "권한 거부",
  FAILED: "실패",
};

/**
 * 성공은 중립으로 둔다.
 *
 * 목록의 대부분이 성공이라 여기에 색을 주면 화면 전체가 물들고, 정작 봐야 할
 * 거부 · 실패가 묻힌다. **눈에 띄어야 하는 것에만 색을 준다.**
 */
export const AUDIT_RESULT_TONE: Record<AuditResult, BadgeTone> = {
  SUCCESS: "neutral",
  DENIED: "danger",
  FAILED: "warning",
};

export const AUDIT_RESULT_OPTIONS: SelectOption[] = [
  { label: "전체 결과", value: "" },
  ...(Object.keys(AUDIT_RESULT_LABEL) as AuditResult[]).map((result) => ({
    label: AUDIT_RESULT_LABEL[result],
    value: result,
  })),
];

/* -------------------------------------------------------------------------
 * 시스템 이벤트
 * ---------------------------------------------------------------------- */

export const SYSTEM_EVENT_LEVEL_LABEL: Record<SystemEventLevel, string> = {
  WARN: "경고",
  ERROR: "오류",
};

export const SYSTEM_EVENT_LEVEL_TONE: Record<SystemEventLevel, BadgeTone> = {
  WARN: "warning",
  ERROR: "danger",
};

export const SYSTEM_EVENT_LEVEL_OPTIONS: SelectOption[] = [
  { label: "전체 레벨", value: "" },
  ...(Object.keys(SYSTEM_EVENT_LEVEL_LABEL) as SystemEventLevel[]).map(
    (level) => ({
      label: SYSTEM_EVENT_LEVEL_LABEL[level],
      value: level,
    }),
  ),
];

export const SYSTEM_EVENT_SOURCE_LABEL: Record<SystemEventSource, string> = {
  API: "API 서버",
  DB: "데이터베이스",
  AI_PROVIDER: "AI 제공자",
  PAYMENT: "결제(PG)",
  PUSH: "푸시",
  STORAGE: "스토리지",
};

export const SYSTEM_EVENT_SOURCE_OPTIONS: SelectOption[] = [
  { label: "전체 발생원", value: "" },
  ...SYSTEM_EVENT_SOURCES.map((source) => ({
    label: SYSTEM_EVENT_SOURCE_LABEL[source],
    value: source,
  })),
];

export const getSystemEventSourceLabel = (source: string): string =>
  SYSTEM_EVENT_SOURCE_LABEL[source as SystemEventSource] ?? source;
