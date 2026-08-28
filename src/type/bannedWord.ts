/**
 * 금지어 사전.
 *
 * 금지어(BAN)로 먼저 걸러 낸 뒤 예외어(EXCEPT)가 그중 일부를 되돌린다.
 * '졸라'는 금지어라 걸리지만 '고르곤졸라'가 예외어로 있으면 그 자리는 살아남는다.
 * 두 종류가 **같은 사전을 이루므로** 한 화면에서 함께 관리한다.
 */

export type BannedWordType = "BAN" | "EXCEPT";

export const BANNED_WORD_TYPE_LABEL: Record<BannedWordType, string> = {
  BAN: "금지어",
  EXCEPT: "예외어",
};

/**
 * 걸렸을 때 어떻게 할지.
 *
 * 확실한 표현은 막고, 맥락에 따라 갈리는 표현은 우선 통과시키되 기록만 남긴다.
 * 처음부터 전부 막으면 오탐이 곧 장애가 된다.
 * 예외어는 무엇도 막지 않으므로 레벨을 갖지 않는다.
 */
export type BannedWordLevel = "BLOCK" | "WARN";

export const BANNED_WORD_LEVEL_LABEL: Record<BannedWordLevel, string> = {
  BLOCK: "차단",
  WARN: "경고",
};

export interface BannedWord {
  bannedWordId: number;
  word: string;
  type: BannedWordType;
  /** 금지어일 때만 값이 있다. */
  level?: BannedWordLevel;
  /**
   * 이 단어에 걸린 횟수.
   *
   * 오탐을 찾는 단서다. 적중이 유난히 많은 단어는 대개 너무 짧거나 다른 말에 흔히
   * 섞이는 단어라, 예외어를 더할지 이 단어를 지울지 판단하는 출발점이 된다.
   */
  hitCount: number;
  /** 등록한 관리자 이름 스냅샷. 계정이 지워져도 남는다. */
  createdBy: string;
  createdById?: number;
  createdAt: string;
}
