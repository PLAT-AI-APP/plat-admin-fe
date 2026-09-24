/**
 * 제작자 수익(plat-earning) 어드민 타입.
 *
 * 수익 포인트는 노트와 별개 화폐다(1P = 1원). 적립 금액만 소수 넷째 자리까지 들고,
 * 잔액 · 원장 · 교환은 모두 정수 포인트다.
 */

export type EarningAccountStatus = "ACTIVE" | "FROZEN";
export type EarningLedgerType =
  | "ACCRUE"
  | "REDEEM"
  | "REDEEM_CANCEL"
  | "EXPIRE"
  | "WITHDRAW_FORFEIT"
  | "ADMIN_DEDUCT"
  | "ADMIN_GRANT";
export type RewardType = "GIFT_CARD" | "NOTE";
/**
 * 상품권·노트 모두 신청 때 포인트가 빠진다. REQUESTED 는 상품권 발송 대기, GRANTING 은 노트 전환에서 노트 지급만
 * 남은 상태다(재시도 배치가 채운다). 반려하면 빠진 포인트를 돌려준다.
 */
export type RewardRedemptionStatus =
  | "REQUESTED"
  | "GRANTING"
  | "ISSUED"
  | "REJECTED";
/** 관리자가 고를 수 있는 사유. WITHDRAWAL · SYSTEM 은 시스템만 남긴다. */
export type EarningReasonCode =
  | "FRAUD_SUSPECTED"
  | "POLICY_VIOLATION"
  | "OPERATION_FIX"
  | "USER_REQUEST";
export type EarningHistoryTarget = "ACCOUNT" | "ACCRUAL" | "REDEMPTION";
export type EarningActorType = "ADMIN" | "SYSTEM" | "USER";
export type EarningReconciliationCheck =
  | "BALANCE_LOTS"
  | "BALANCE_LEDGER"
  | "ACCRUAL_CREDIT"
  | "PAID_USE";

export interface EarningAccountRow {
  accountId: string;
  userId: string;
  nickname?: string;
  status: EarningAccountStatus;
  available: number;
  accrued30d: number;
  paidChatters30d: number;
  totalAccrued: number;
  totalRedeemed: number;
  lastAccruedAt?: string;
}

export interface EarningAccountTotals {
  available: number;
  accrued30d: number;
}

export interface EarningAccountDetail {
  accountId: string;
  userId: string;
  nickname?: string;
  status: EarningAccountStatus;
  available: number;
  accrued30d: number;
  totalAccrued: number;
  totalRedeemed: number;
}

export interface EarningContribution {
  userId: string;
  nickname?: string;
  joinedAt?: string;
  paidNotes: number;
  amount: number;
}

export interface EarningLedgerRow {
  ledgerId: string;
  type: EarningLedgerType;
  amount: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  productName?: string;
  reasonCode?: string;
  memo?: string;
  actorName?: string;
  createdAt: string;
}

export interface EarningAccrualRow {
  accrualId: string;
  /** 노트를 쓴 날(KST, YYYY-MM-DD) */
  accrualDate: string;
  universeId: string;
  universeTitle?: string;
  chatterUserId: string;
  chatterNickname?: string;
  paidNotes: number;
  turnCount: number;
  noteUnitPrice: number;
  shareBps: number;
  /** 소수 넷째 자리까지 */
  amount: number;
}

export interface EarningHistory {
  historyId: string;
  targetType: EarningHistoryTarget;
  targetId: string;
  fromStatus?: string;
  toStatus: string;
  actorType: EarningActorType;
  actorName?: string;
  reasonCode: string;
  memo?: string;
  createdAt: string;
}

export interface Redemption {
  redemptionId: string;
  accountId: string;
  userId: string;
  nickname?: string;
  accountStatus: EarningAccountStatus;
  productName: string;
  type: RewardType;
  pointAmount: number;
  noteAmount?: number;
  status: RewardRedemptionStatus;
  recipientPhone?: string;
  requestedAt: string;
  processedAt?: string;
  processedByName?: string;
  rejectReason?: string;
  memo?: string;
}

export interface EarningPolicy {
  policyId: string;
  shareBps: number;
  noteUnitPrice: number;
  minRedeemAmount: number;
  validYears: number;
  effectiveFrom: string;
  changedByName?: string;
  memo?: string;
}

export type EarningPolicyValues = Pick<
  EarningPolicy,
  "shareBps" | "noteUnitPrice" | "minRedeemAmount" | "validYears"
>;

/** 교환 상품(상품권). 노트는 상품 없이 제작자가 원하는 만큼 전환한다. */
export interface RewardProduct {
  productId: string;
  name: string;
  imageFileId?: string;
  imageUrl?: string;
  pointPrice: number;
  active: boolean;
  sortOrder: number;
}

export type RewardProductFormValues = Omit<RewardProduct, "productId" | "imageUrl">;

export interface EarningReconciliation {
  runDate: string;
  checkCode: EarningReconciliationCheck;
  expected: number;
  actual: number;
  matched: boolean;
}

/** 계정 조치 공통 입력. 사유 코드와 메모가 모두 필수다. */
export interface EarningActionInput {
  reasonCode: EarningReasonCode;
  memo: string;
}

export const EARNING_REASON_LABEL: Record<string, string> = {
  FRAUD_SUSPECTED: "부정 사용 의심",
  POLICY_VIOLATION: "운영 정책 위반",
  OPERATION_FIX: "운영 정정",
  USER_REQUEST: "본인 요청",
  WITHDRAWAL: "회원 탈퇴",
  SYSTEM: "시스템",
};

export const EARNING_REASON_OPTIONS: { label: string; value: EarningReasonCode }[] = (
  ["FRAUD_SUSPECTED", "POLICY_VIOLATION", "OPERATION_FIX", "USER_REQUEST"] as const
).map((value) => ({ label: EARNING_REASON_LABEL[value], value }));

export const EARNING_LEDGER_LABEL: Record<EarningLedgerType, string> = {
  ACCRUE: "적립",
  REDEEM: "교환",
  REDEEM_CANCEL: "반려 환불",
  EXPIRE: "만료",
  WITHDRAW_FORFEIT: "탈퇴 소멸",
  ADMIN_DEDUCT: "관리자 차감",
  ADMIN_GRANT: "관리자 지급",
};

export const EARNING_RECONCILIATION_LABEL: Record<EarningReconciliationCheck, string> = {
  BALANCE_LOTS: "잔액 = 포인트 묶음 남은 양 합계",
  BALANCE_LEDGER: "잔액 ≠ 마지막 원장 잔액인 계정 수",
  ACCRUAL_CREDIT: "적립 합계 = 적립 원장 합 + 이월 소수",
  PAID_USE: "전날 유료 노트 사용 = 적립에 반영된 유료 노트",
};
