export type ProductStatus = "ON_SALE" | "HIDDEN" | "ENDED";
export type ProductPlatform = "IOS" | "AOS" | "WEB";
export type ProductCurrency = "KRW" | "JPY" | "USD" | "THB";

/**
 * 크레딧 충전 상품.
 *
 * **한 건 = 플랫폼 하나 + 통화 하나 + 가격 하나**다. 같은 크레딧 구성이라도 스토어
 * 등록 금액이 다르므로 플랫폼별로 상품을 따로 만든다.
 */
export interface BillingProduct {
  productId: number;
  /** 스토어 등록과 대조하는 상품 코드. 영문 대문자·숫자·밑줄만 쓴다. */
  code: string;
  name: string;
  /** 결제 화면에 그대로 나가는 문구. */
  description: string;
  platform: ProductPlatform;
  currency: ProductCurrency;
  /**
   * 결제 금액. **통화의 최소 단위 정수다** — KRW는 minor unit이 0이라 5900이 곧 5,900원이다.
   * `price`라고 부르지 않는 이유는 통화가 늘었을 때 최소 단위를 원 단위처럼 그리지 않기 위해서다.
   */
  amountMinor: number;
  /** 지급 크레딧 (정수) */
  credit: number;
  /** 보너스 크레딧 (정수) */
  bonusCredit: number;
  status: ProductStatus;
  sortOrder: number;
  updatedAt: string;
}

export interface BillingProductFormValues {
  code: string;
  name: string;
  description: string;
  platform: ProductPlatform;
  amountMinor: number;
  credit: number;
  bonusCredit: number;
  status: ProductStatus;
  sortOrder: number;
}

/**
 * 크레딧 정책 키.
 *
 * **금액이 고정된 정책만** 여기서 다룬다. 채팅 메시지·이미지 생성처럼 모델과 옵션
 * (이미지 크기·화질 등)에 따라 차감액이 달라지는 사용 요금은 고정값으로 묶을 수 없어
 * AI 모델 설정에서 모델별로 관리한다.
 */
export type CreditPolicyKey =
  | "SIGN_UP_BONUS"
  | "PROFILE_COMPLETE_BONUS"
  | "ADULT_VERIFICATION_BONUS"
  | "DAILY_ATTENDANCE"
  | "ATTENDANCE_STREAK_7DAYS"
  | "DORMANT_RETURN_BONUS"
  | "REFERRAL_BONUS"
  | "INVITEE_BONUS"
  | "FIRST_PURCHASE_BONUS";

export interface CreditPolicy {
  policyKey: CreditPolicyKey;
  label: string;
  description: string;
  /** 지급은 양수, 차감은 음수로 관리한다. */
  amount: number;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
  /** 수정 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  updatedById?: number;
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
  /** 처리 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  processedById?: number;
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
