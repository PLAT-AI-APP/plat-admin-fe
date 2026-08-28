import {
  BANNED_WORD_LEVEL_LABEL,
  BANNED_WORD_TYPE_LABEL,
  type BannedWordLevel,
  type BannedWordType,
} from "@/type/bannedWord";
import type { BadgeTone, SelectOption, TabItem } from "@/components/ui";

export const BANNED_WORD_LEVEL_TONE: Record<BannedWordLevel, BadgeTone> = {
  BLOCK: "danger",
  WARN: "warning",
};

/**
 * 유형 탭.
 *
 * 금지어와 예외어를 한 표에 섞지 않는다. 둘은 열이 다르고(예외어에는 처리 레벨이 없다)
 * 운영자가 하는 일도 다르다 — 무엇을 막을지 정하는 일과 오탐을 풀어 주는 일이다.
 * 탭으로 나누면 지금 보는 표가 어느 쪽인지가 늘 분명하고, 그래서 유형 열과 유형 필터가
 * 통째로 필요 없어진다.
 */
export const BANNED_WORD_TYPE_TABS: TabItem<BannedWordType>[] = [
  { label: BANNED_WORD_TYPE_LABEL.BAN, value: "BAN" },
  { label: BANNED_WORD_TYPE_LABEL.EXCEPT, value: "EXCEPT" },
];

/** 등록 폼용 옵션. 처음 고르는 자리라 무엇이 달라지는지를 라벨에 함께 적는다. */
export const BANNED_WORD_LEVEL_OPTIONS: SelectOption[] = [
  { label: `${BANNED_WORD_LEVEL_LABEL.BLOCK} (등록 차단)`, value: "BLOCK" },
  { label: `${BANNED_WORD_LEVEL_LABEL.WARN} (기록만)`, value: "WARN" },
];

/**
 * 표 안에서 바로 바꾸는 셀렉트용.
 *
 * 설명을 뺀 짧은 라벨을 쓴다. 좁은 칸에서 괄호까지 넣으면 잘려서 오히려 무슨 값인지
 * 알 수 없고, 이 자리는 이미 무엇을 고르는지 아는 사람이 값만 바꾸는 곳이다.
 */
export const BANNED_WORD_LEVEL_CELL_OPTIONS: SelectOption[] = [
  { label: BANNED_WORD_LEVEL_LABEL.BLOCK, value: "BLOCK" },
  { label: BANNED_WORD_LEVEL_LABEL.WARN, value: "WARN" },
];

export const BANNED_WORD_LEVEL_FILTER_OPTIONS: SelectOption[] = [
  { label: "레벨 전체", value: "" },
  { label: BANNED_WORD_LEVEL_LABEL.BLOCK, value: "BLOCK" },
  { label: BANNED_WORD_LEVEL_LABEL.WARN, value: "WARN" },
];
