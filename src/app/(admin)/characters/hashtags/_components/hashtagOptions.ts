import type { SelectOption } from "@/components/ui/Select";
import type { BadgeTone } from "@/components/ui/Badge";
import {
  HASHTAG_CATEGORIES,
  HASHTAG_CATEGORY_LABEL,
  type HashtagCategory,
} from "@/type/hashtag";

/** 분류가 9개라 색이 반복된다. 인접한 분류끼리만 겹치지 않게 배치한다. */
export const HASHTAG_CATEGORY_TONE: Record<HashtagCategory, BadgeTone> = {
  GENRE: "brand",
  SPECIES: "info",
  CHARACTER: "success",
  APPEARANCE: "warning",
  PERSONALITY: "danger",
  RELATION: "brand",
  NARRATIVE: "info",
  OCCUPATION: "success",
  SPECIAL: "neutral",
};

/** 등록·수정 모달용 (전체 선택지 없음). 앱 노출 순서를 그대로 따른다. */
export const HASHTAG_CATEGORY_OPTIONS: SelectOption<HashtagCategory>[] =
  HASHTAG_CATEGORIES.map((category) => ({
    label: HASHTAG_CATEGORY_LABEL[category],
    value: category,
  }));

/** 목록 필터용 (전체 포함) */
export const HASHTAG_CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 분류", value: "" },
  ...HASHTAG_CATEGORY_OPTIONS,
];

export const HASHTAG_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  { label: "노출 중", value: "true" },
  { label: "노출 중지", value: "false" },
];

export const HASHTAG_SORT_OPTIONS: SelectOption[] = [
  { label: "노출 순서", value: "ORDER" },
  { label: "사용 많은 순", value: "USAGE" },
  { label: "최근 등록순", value: "RECENT" },
];
