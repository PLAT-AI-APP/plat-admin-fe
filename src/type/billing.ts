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
  /** Snowflake 유저 ID. 문자열 그대로 보낸다 — 자세한 이유는 `AdjustableUser`에 있다. */
  userId: string;
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

/* ------------------------------------------------------------------ */
/* 결제 보존 원장                                                        */
/* ------------------------------------------------------------------ */

/**
 * 결제 대행사.
 *
 * **계약이 확정되기 전이라 국내에서 흔히 붙이는 곳을 미리 열거해 둔다.**
 * 확정되면 쓰지 않는 값을 지우면 되고, 그 전까지는 결제사별로 남는 값의 생김새가
 * 다르다는 사실(거래번호 형식·승인번호 유무)을 화면이 먼저 감당하게 한다.
 */
export type PgProvider =
  | "KAKAOPAY"
  | "TOSSPAY"
  | "NAVERPAY"
  | "PAYCO"
  | "NICEPAY"
  | "INICIS"
  | "APPLE_IAP"
  | "GOOGLE_IAP";

export type PaymentMethod =
  | "CARD"
  | "EASY_PAY"
  | "TRANSFER"
  | "VIRTUAL_ACCOUNT"
  | "PHONE"
  | "IN_APP";

/**
 * 결제 건의 최종 상태.
 *
 * `CANCELED`(취소)와 `REFUNDED`(환불)를 나눈다. **돈이 되돌아간 경로가 다르다** —
 * 취소는 매입 전에 승인 자체를 무르는 것이라 카드 명세서에 아무것도 남지 않고,
 * 환불은 이미 매입된 건을 되돌리는 것이라 결제와 환불이 각각 찍힌다.
 * 분쟁이 들어오면 유저가 보는 명세서가 다르므로 원장에서도 구분해 둔다.
 */
export type PaymentRecordStatus =
  | "APPROVED"
  | "CANCELED"
  | "PARTIAL_REFUNDED"
  | "REFUNDED";

/** 상태를 바꾼 주체. 같은 환불이어도 누가 걸었는지에 따라 확인할 곳이 다르다. */
export type PaymentEventSource = "PG" | "ADMIN" | "STORE";

/** 원장에 남는 상태 변화 한 줄. 마지막 상태만이 아니라 **언제 무엇이 일어났는지**를 남긴다. */
export interface PaymentRecordEvent {
  type: Exclude<PaymentRecordStatus, "PARTIAL_REFUNDED"> | "PARTIAL_REFUND";
  /** 이 사건에서 오간 금액 (최소 단위 정수) */
  amount: number;
  reason?: string;
  source: PaymentEventSource;
  occurredAt: string;
}

/**
 * 결제 보존 원장 한 건.
 *
 * **회원이 탈퇴하고 개인정보가 파기된 뒤에도 남는 기록이다.**
 * 전자상거래법 제6조·시행령 제6조가 대금 결제와 재화 공급에 관한 기록을 5년간
 * 보존하도록 하고, 개인정보보호법 제21조 단서가 "다른 법령에 따라 보존하는 경우"를
 * 파기 의무의 예외로 둔다. 그래서 **남길 수 있는 것은 이 두 가지가 겹치는 범위뿐**이다.
 *
 * 남기는 것: 거래를 특정하는 값(결제사 거래번호·주문번호·승인번호), 무엇을 얼마에
 * 팔았는지(상품·금액·부가세), 그 결제가 어떻게 끝났는지(승인·취소·환불과 그 시각).
 *
 * 남기지 않는 것: 이름 · 연락처 · 이메일 · 카드번호처럼 사람을 가리키는 값.
 * 파기 시점에 함께 지운다. 그래서 이 화면의 조회 키는 유저가 아니라 `pgTid`다.
 */
export interface PaymentRecord {
  recordId: number;
  status: PaymentRecordStatus;
  pgProvider: PgProvider;
  /** 결제사가 발급한 거래 고유번호. 개인정보를 지운 뒤 **이 값이 유일한 조회 키**다. */
  pgTid: string;
  /** 우리가 발급한 주문번호. 결제사에 문의할 때 함께 대조한다. */
  merchantOrderId: string;
  /** 카드 승인번호. 카드 결제가 아니면 값이 없다. */
  approvalNo?: string;
  method: PaymentMethod;
  /** 카드사 이름. 카드번호는 남기지 않는다. */
  cardIssuer?: string;
  /** 할부 개월. 0은 일시불이다. */
  installmentMonths?: number;
  platform: ProductPlatform;
  currency: ProductCurrency;
  /** 승인 금액 (통화의 최소 단위 정수) */
  amount: number;
  /** 부가세. 공급가액은 `amount - vatAmount`로 계산한다. */
  vatAmount: number;
  /** 되돌려준 금액 누계. 전액 환불이면 `amount`와 같다. */
  refundedAmount: number;
  productCode: string;
  productName: string;
  /** 지급했던 크레딧 (보너스 포함). "무엇을 공급했는가"에 해당한다. */
  credit: number;
  approvedAt: string;
  /** 마지막 상태 변화 시각. 목록 정렬과 "언제 끝난 건인가"에 쓴다. */
  lastEventAt: string;
  events: PaymentRecordEvent[];
  /** 결제사가 발급한 영수증. 원본 확인이 필요할 때 여기로 간다. */
  receiptUrl?: string;
  /**
   * 파기 후에도 남는 회원 식별자 (단방향 해시).
   *
   * 같은 사람의 결제를 묶어 보려면 무언가는 있어야 하는데, 되돌릴 수 있는 값이면
   * 그것 자체가 개인정보다. 해시만 남기면 **한 사람의 거래를 모을 수는 있어도
   * 그 사람이 누구인지는 알 수 없다.**
   */
  userKey: string;
  /** 아직 파기되지 않은 회원의 결제. 파기 후에는 값이 없다. */
  userId?: number;
  userNickname?: string;
  isWithdrawn: boolean;
  withdrawnAt?: string;
  /** 개인정보 파기 완료 시각. 이 시점부터 `userKey`로만 조회된다. */
  purgedAt?: string;
  /** 보존 만료일 (결제일 + 5년). 이 날짜가 지나면 원장도 파기 대상이다. */
  retentionUntil: string;
}

export interface PaymentRecordSummary {
  totalCount: number;
  /** 탈퇴한 회원의 결제 건. 이 화면이 존재하는 이유다. */
  withdrawnCount: number;
  /** 90일 안에 보존 기간이 끝나는 건수. 파기 배치 전에 확인한다. */
  expiringCount: number;
  /** 환불·취소를 뺀 순 승인 금액 */
  netApprovedAmount: number;
}
