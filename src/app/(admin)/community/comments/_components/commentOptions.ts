import type { BadgeTone, SelectOption } from "@/components/ui";
import {
  COMMENT_STATUS_LABEL,
  COMMENT_TARGET_TYPE_LABEL,
  type CommentStatus,
  type CommentTargetType,
} from "@/type/comment";

/**
 * 분류 색.
 *
 * 대상이 무엇인지는 목록을 훑을 때 **색으로 먼저** 읽힌다. brand(남보라)와
 * info(파랑)는 색상환에서 너무 가까워 나란히 놓으면 한 덩어리로 보인다.
 * 그래서 보색에 가까운 남보라 / 주황 짝으로 벌려 둔다.
 */
export const COMMENT_TARGET_TYPE_TONE: Record<CommentTargetType, BadgeTone> = {
  UNIVERSE: "brand",
  CHARACTER: "warning",
};

export const COMMENT_STATUS_TONE: Record<CommentStatus, BadgeTone> = {
  VISIBLE: "success",
  HIDDEN: "warning",
  DELETED: "neutral",
};

const TARGET_TYPES = Object.keys(
  COMMENT_TARGET_TYPE_LABEL,
) as CommentTargetType[];

const STATUSES = Object.keys(COMMENT_STATUS_LABEL) as CommentStatus[];

export const COMMENT_TARGET_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 대상", value: "" },
  ...TARGET_TYPES.map((targetType) => ({
    label: COMMENT_TARGET_TYPE_LABEL[targetType],
    value: targetType,
  })),
];

export const COMMENT_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...STATUSES.map((status) => ({
    label: COMMENT_STATUS_LABEL[status],
    value: status,
  })),
];

export const COMMENT_SORT_OPTIONS: SelectOption[] = [
  { label: "최신순", value: "RECENT" },
  { label: "신고 많은 순", value: "REPORTED" },
];

/** 숨김 처리 사유 기본 선택지. 직접 입력도 허용한다. */
export const COMMENT_HIDE_REASONS = [
  "욕설 및 비방 표현이 포함되어 있습니다.",
  "광고성 링크가 포함되어 있습니다.",
  "스포일러를 사전 안내 없이 노출했습니다.",
  "타 이용자를 특정해 비난했습니다.",
  "음란물 또는 선정적 표현이 포함되어 있습니다.",
];
