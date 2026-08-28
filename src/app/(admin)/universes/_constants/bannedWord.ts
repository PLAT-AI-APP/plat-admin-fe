import {
  BANNED_WORD_TYPE_LABEL,
  type BannedWordSort,
  type BannedWordType,
} from "@/type/bannedWord";
import type { SelectOption, TabItem } from "@/components/ui";

/**
 * 유형 탭.
 *
 * 금지어와 예외어를 한 표에 섞지 않는다. 운영자가 하는 일이 다르기 때문이다 — 무엇을
 * 막을지 정하는 일과 오탐을 풀어 주는 일이다. 탭으로 나누면 지금 보는 표가 어느 쪽인지가
 * 늘 분명하고, 그래서 유형 열과 유형 필터가 통째로 필요 없어진다.
 */
export const BANNED_WORD_TYPE_TABS: TabItem<BannedWordType>[] = [
  { label: BANNED_WORD_TYPE_LABEL.BAN, value: "BAN" },
  { label: BANNED_WORD_TYPE_LABEL.EXCEPT, value: "EXCEPT" },
];

/**
 * 정렬 기준.
 *
 * 줄을 세울 수 있는 것은 등록일과 단어 둘뿐이다. 등록일순은 방금 넣은 단어를 확인할 때,
 * 단어순은 비슷한 표현이 이미 등록돼 있는지 훑을 때 쓴다.
 */
export const BANNED_WORD_SORT_OPTIONS: SelectOption<BannedWordSort>[] = [
  { label: "최근등록순", value: "CREATED_DESC" },
  { label: "오래된순", value: "CREATED_ASC" },
  { label: "단어 오름차순", value: "WORD_ASC" },
  { label: "단어 내림차순", value: "WORD_DESC" },
];
