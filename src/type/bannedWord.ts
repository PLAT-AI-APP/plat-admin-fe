/**
 * 금지어 사전.
 *
 * 금지어(BAN)로 먼저 걸러 낸 뒤 예외어(EXCEPT)가 그중 일부를 되돌린다.
 * '졸라'는 금지어라 걸리지만 '고르곤졸라'가 예외어로 있으면 그 자리는 살아남는다.
 * 두 종류가 **같은 사전을 이루므로** 한 화면에서 함께 관리한다.
 *
 * 처리 레벨은 두지 않는다. 걸리면 막는다, 하나뿐이다.
 */

export type BannedWordType = "BAN" | "EXCEPT";

export const BANNED_WORD_TYPE_LABEL: Record<BannedWordType, string> = {
  BAN: "금지어",
  EXCEPT: "예외어",
};

export interface BannedWord {
  bannedWordId: number;
  word: string;
  type: BannedWordType;
  /** 등록한 관리자 이름 스냅샷. 계정이 지워져도 남는다. */
  createdBy: string;
  createdById?: number;
  createdAt: string;
}
