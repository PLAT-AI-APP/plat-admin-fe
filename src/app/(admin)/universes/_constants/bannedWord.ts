import { BANNED_WORD_TYPE_LABEL, type BannedWordType } from "@/type/bannedWord";
import type { TabItem } from "@/components/ui";

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
