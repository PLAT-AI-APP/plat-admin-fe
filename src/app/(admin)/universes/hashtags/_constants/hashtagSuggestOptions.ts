import type { SelectOption } from "@/components/ui/Select";
import type { HashtagSuggestSort } from "@/type/hashtag";

/**
 * 등록 여부 필터.
 *
 * 운영이 이 표를 여는 첫 이유는 "아직 없는 태그 중 사람들이 원하는 것"을 찾는 일이라
 * 미등록만 보는 선택지를 먼저 둔다. 이미 등록된 태그가 계속 제안된다면 그건 태그가
 * 없어서가 아니라 **못 찾아서**라는 다른 신호다.
 */
export const HASHTAG_SUGGEST_REGISTERED_OPTIONS: SelectOption[] = [
  { label: "전체 제안", value: "" },
  { label: "미등록 태그만", value: "false" },
  { label: "이미 등록됨", value: "true" },
];

/** 정렬. 서버가 지원하는 값을 그대로 노출한다. */
export const HASHTAG_SUGGEST_SORT_OPTIONS: SelectOption<HashtagSuggestSort>[] =
  [
    { label: "요청 많은 순", value: "COUNT_DESC" },
    { label: "최근 제안순", value: "RECENT_DESC" },
    { label: "오래된 제안순", value: "RECENT_ASC" },
    { label: "이름 오름차순", value: "NAME_ASC" },
  ];
