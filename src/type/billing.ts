export type ProductStatus = "ON_SALE" | "HIDDEN" | "ENDED";
export type ProductPlatform = "IOS" | "AOS" | "WEB";

/** 크레딧 상품. 모든 금액은 원 단위 정수다. */
export interface BillingProduct {
  productId: number;
  name: string;
  /** 결제 금액 (원) */
  price: number;
  /** 지급 크레딧 (정수) */
  credit: number;
  /** 보너스 크레딧 (정수) */
  bonusCredit: number;
  platform: ProductPlatform;
  status: ProductStatus;
  order: number;
  updatedAt: string;
}

export interface BillingProductFormValues {
  name: string;
  price: number;
  credit: number;
  bonusCredit: number;
  platform: ProductPlatform;
  status: ProductStatus;
}

/** 크레딧 정책 */
export type CreditPolicyKey =
  | "SIGN_UP_BONUS"
  | "DAILY_ATTENDANCE"
  | "CHAT_MESSAGE_COST"
  | "IMAGE_GENERATION_COST"
  | "CHARACTER_CREATE_REWARD"
  | "REFERRAL_BONUS";

export interface CreditPolicy {
  policyKey: CreditPolicyKey;
  label: string;
  description: string;
  /** 지급은 양수, 차감은 음수로 관리한다. */
  amount: number;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

/** 크레딧 수동 조정 */
export type AdjustmentType = "GRANT" | "DEDUCT";

export interface CreditAdjustment {
  adjustmentId: number;
  userId: number;
  userNickname: string;
  type: AdjustmentType;
  amount: number;
  /** 운영 리스크가 크므로 사유를 필수로 남긴다. */
  reason: string;
  balanceAfter: number;
  processedBy: string;
  createdAt: string;
}

export interface CreditAdjustmentFormValues {
  userId: number;
  type: AdjustmentType;
  amount: number;
  reason: string;
}

/** 결제/크레딧 장부 */
export type LedgerType = "PAYMENT" | "CHARGE" | "USE" | "REFUND" | "ADJUSTMENT";

export interface LedgerEntry {
  ledgerId: number;
  type: LedgerType;
  userId: number;
  userNickname: string;
  /** 결제 금액 (원). 크레딧 사용 건은 0이다. */
  amount: number;
  /** 크레딧 증감 (정수) */
  creditDelta: number;
  productName?: string;
  memo: string;
  createdAt: string;
}

export interface LedgerSummary {
  totalPaidAmount: number;
  totalRefundAmount: number;
  totalChargedCredit: number;
  totalUsedCredit: number;
}
