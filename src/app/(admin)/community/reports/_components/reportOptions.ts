import type { BadgeTone, SelectOption, TabItem } from "@/components/ui";
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "@/type/report";

export const REPORT_TARGET_TYPE_TONE: Record<ReportTargetType, BadgeTone> = {
  CHARACTER: "brand",
  COMMENT: "info",
  USER: "neutral",
};

export const REPORT_STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  PENDING: "warning",
  REVIEWING: "info",
  RESOLVED: "success",
  REJECTED: "neutral",
};

export const REPORT_REASON_TONE: Record<ReportReason, BadgeTone> = {
  SEXUAL: "danger",
  VIOLENCE: "danger",
  HATE: "warning",
  COPYRIGHT: "info",
  SPAM: "neutral",
  ETC: "neutral",
};

const TARGET_TYPES = Object.keys(
  REPORT_TARGET_TYPE_LABEL,
) as ReportTargetType[];
const STATUSES = Object.keys(REPORT_STATUS_LABEL) as ReportStatus[];
const REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];

/** 상태 탭. 접수·검토 중이 먼저 오도록 선언 순서를 유지한다. */
export const REPORT_STATUS_TABS: TabItem<ReportStatus | "">[] = [
  { label: "전체", value: "" },
  ...STATUSES.map((status) => ({
    label: REPORT_STATUS_LABEL[status],
    value: status,
  })),
];

/** 처리 모달용 (전체 선택지 없음) */
export const REPORT_STATUS_OPTIONS: SelectOption<ReportStatus>[] = STATUSES.map(
  (status) => ({ label: REPORT_STATUS_LABEL[status], value: status }),
);

export const REPORT_TARGET_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 대상", value: "" },
  ...TARGET_TYPES.map((targetType) => ({
    label: REPORT_TARGET_TYPE_LABEL[targetType],
    value: targetType,
  })),
];

export const REPORT_REASON_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 사유", value: "" },
  ...REASONS.map((reason) => ({
    label: REPORT_REASON_LABEL[reason],
    value: reason,
  })),
];

export const REPORT_SORT_OPTIONS: SelectOption[] = [
  { label: "최신순", value: "RECENT" },
  { label: "누적 신고 많은 순", value: "REPORTED" },
];
