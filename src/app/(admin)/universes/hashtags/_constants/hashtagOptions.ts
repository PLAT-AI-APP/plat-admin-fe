import type { SelectOption } from "@/components/ui/Select";
import type { BadgeTone } from "@/components/ui/Badge";
import {
  HASHTAG_CATEGORIES,
  HASHTAG_CATEGORY_LABEL,
  type HashtagCategory,
  type HashtagSort,
} from "@/type/hashtag";

/** 분류가 11개라 색이 반복된다. 인접한 분류끼리만 겹치지 않게 배치한다. */
export const HASHTAG_CATEGORY_TONE: Record<HashtagCategory, BadgeTone> = {
  GENRE: "brand",
  BACKGROUND: "info",
  RACE: "success",
  CHARACTER: "warning",
  APPEARANCE: "danger",
  PERSONALITY: "brand",
  RELATIONSHIP: "info",
  NARRATIVE: "success",
  OCCUPATION: "warning",
  MOOD: "danger",
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

/** 성인 태그 필터. 성인 태그는 노출 대상이 달라 따로 골라 볼 수 있어야 한다. */
export const HASHTAG_ADULT_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 태그", value: "" },
  { label: "성인 태그만", value: "true" },
  { label: "일반 태그만", value: "false" },
];

/** 정렬. 서버가 지원하는 값을 그대로 노출한다. */
export const HASHTAG_SORT_OPTIONS: SelectOption<HashtagSort>[] = [
  { label: "최근 등록순", value: "CREATED_DESC" },
  { label: "오래된순", value: "CREATED_ASC" },
  { label: "사용 많은 순", value: "USAGE_DESC" },
  { label: "사용 적은 순", value: "USAGE_ASC" },
  { label: "이름 오름차순", value: "NAME_ASC" },
  { label: "이름 내림차순", value: "NAME_DESC" },
];
