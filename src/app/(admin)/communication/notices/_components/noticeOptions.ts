import type { BadgeTone, SelectOption } from "@/components/ui";
import {
  NOTICE_CATEGORY_LABEL,
  NOTICE_STATUS_LABEL,
  type NoticeCategory,
  type NoticeStatus,
} from "@/type/notice";

export const NOTICE_CATEGORY_TONE: Record<NoticeCategory, BadgeTone> = {
  SERVICE: "neutral",
  UPDATE: "brand",
  EVENT: "success",
  MAINTENANCE: "warning",
  POLICY: "info",
};

export const NOTICE_STATUS_TONE: Record<NoticeStatus, BadgeTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  HIDDEN: "warning",
};

const CATEGORIES = Object.keys(NOTICE_CATEGORY_LABEL) as NoticeCategory[];
const STATUSES = Object.keys(NOTICE_STATUS_LABEL) as NoticeStatus[];

/** 등록·수정 모달용 (전체 선택지 없음) */
export const NOTICE_CATEGORY_OPTIONS: SelectOption<NoticeCategory>[] =
  CATEGORIES.map((category) => ({
    label: NOTICE_CATEGORY_LABEL[category],
    value: category,
  }));

export const NOTICE_STATUS_OPTIONS: SelectOption<NoticeStatus>[] = STATUSES.map(
  (status) => ({
    label: NOTICE_STATUS_LABEL[status],
    value: status,
  }),
);

/** 목록 필터용 (전체 포함) */
export const NOTICE_CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 분류", value: "" },
  ...NOTICE_CATEGORY_OPTIONS,
];

export const NOTICE_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...NOTICE_STATUS_OPTIONS,
];
