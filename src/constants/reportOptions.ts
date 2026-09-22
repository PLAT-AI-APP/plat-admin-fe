import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import {
  REPORT_CASE_STATUS_LABEL,
  REPORT_REASON_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  type ReportCaseSort,
  type ReportCaseStatus,
  type ReportReason,
  type ReportTargetStatus,
  type ReportTargetType,
} from "@/type/report";

/**
 * 분류 색.
 *
 * 세계관은 **댓글 관리와 같은 남보라**를 쓴다. 두 화면을 오갈 때 같은 대상이
 * 다른 색이면 색으로 훑는 것 자체가 성립하지 않는다. 댓글은 주황으로 벌린다.
 */
export const REPORT_TARGET_TYPE_TONE: Record<ReportTargetType, BadgeTone> = {
  COMMENT: "warning",
  UNIVERSE: "brand",
};

export const REPORT_CASE_STATUS_TONE: Record<ReportCaseStatus, BadgeTone> = {
  PENDING: "warning",
  ACTIONED: "success",
  DISMISSED: "neutral",
};

export const REPORT_REASON_TONE: Record<ReportReason, BadgeTone> = {
  SEXUAL: "danger",
  VIOLENCE: "danger",
  HATE: "warning",
  COPYRIGHT: "info",
  SPAM: "neutral",
  ETC: "neutral",
};

/** 대상 현재 상태 색. 앱에 그대로 노출 중인 상태만 초록으로 둔다. */
export const REPORT_TARGET_STATUS_TONE: Record<ReportTargetStatus, BadgeTone> = {
  VISIBLE: "success",
  ACTIVE: "success",
  HIDDEN: "warning",
  INACTIVE: "warning",
  DELETED: "neutral",
  PURGED: "neutral",
};

export const REPORT_TARGET_TYPES = Object.keys(
  REPORT_TARGET_TYPE_LABEL,
) as ReportTargetType[];
export const REPORT_REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];
export const REPORT_CASE_STATUSES = Object.keys(
  REPORT_CASE_STATUS_LABEL,
) as ReportCaseStatus[];

/**
 * 상태 탭의 "전체" 값.
 *
 * 목록 주소는 빈 값을 기본값(처리 대기)으로 되돌리므로, 전체를 빈 문자열로 두면
 * 탭을 눌러도 대기 목록이 다시 나온다. 서버에는 보내지 않는다.
 */
export const REPORT_STATUS_ALL = "ALL";

export const REPORT_TARGET_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 대상", value: "" },
  ...REPORT_TARGET_TYPES.map((targetType) => ({
    label: REPORT_TARGET_TYPE_LABEL[targetType],
    value: targetType,
  })),
];

export const REPORT_REASON_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 사유", value: "" },
  ...REPORT_REASONS.map((reason) => ({
    label: REPORT_REASON_LABEL[reason],
    value: reason,
  })),
];

export const REPORT_CASE_SORT_OPTIONS: SelectOption<ReportCaseSort>[] = [
  { label: "누적 신고 많은 순", value: "REPORT_COUNT_DESC" },
  { label: "최근 신고순", value: "LAST_REPORTED_DESC" },
];

/** 누적 신고가 이 수 이상이면 목록에서 붉게 강조한다. */
export const REPORT_COUNT_HIGHLIGHT = 5;

/** 처리 메모 최대 길이. 서버 규칙(1000자)에 맞춘다. */
export const REPORT_NOTE_MAX_LENGTH = 1000;

/**
 * 기간 정지 선택지(일).
 * 유저 관리의 계정 정지와 같은 기간을 써서, 같은 위반에 화면마다 다른 기간이 걸리지 않게 한다.
 */
export const REPORT_SUSPEND_PERIOD_OPTIONS: SelectOption[] = [
  { label: "3일", value: "3" },
  { label: "7일", value: "7" },
  { label: "30일", value: "30" },
];
