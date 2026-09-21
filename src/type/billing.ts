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
  /** 어드민 안에서만 쓰는 식별자라 Snowflake가 아니다. 숫자로 그대로 다룬다. */
  adjustmentId: number;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `AdjustableUser`에 있다. */
  userId: string;
  /** 조정 시점 스냅샷이 아니라 지금 닉네임이다. 닉네임을 바꾼 유저도 알아볼 수 있어야 한다. */
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

/**
 * 결제/크레딧 장부 한 줄의 성격.
 *
 * 서버 원장은 결제 충전·이벤트 지급·관리자 지급을 전부 `CHARGE` 하나로 적는다.
 * 운영자가 구분해야 하는 것이 바로 그 셋이라, 서버가 **유형 + 출처**를 합쳐
 * 이 값으로 내려 준다.
 *
 * `EXPIRE`는 원장에는 있는데 화면에 없던 값이다. 만료는 아무도 누르지 않았는데
 * 잔액이 줄어드는 유일한 경로라, 보이지 않으면 설명할 수 없는 차액이 생긴다.
 */
export type LedgerType =
  | "PAYMENT"
  | "CHARGE"
  | "USE"
  | "REFUND"
  | "EXPIRE"
  | "ADJUSTMENT";

export interface LedgerEntry {
  /** Snowflake. 문자열 그대로 다룬다 — 숫자로 바꾸면 끝자리가 뭉갠다. */
  ledgerId: string;
  type: LedgerType;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  userId: string;
  userNickname: string;
  /** 결제 금액 (원). 크레딧 사용 건은 0이다. */
  amount: number;
  /** 크레딧 증감 (정수) */
  creditDelta: number;
  productName?: string;
  /**
   * 이 줄을 만든 결제. 충전 · 환불 회수 줄에만 있다(사용 · 만료 · 조정은 결제와 무관).
   * 원장에서 그 결제의 상세로 건너가는 유일한 연결이다.
   */
  paymentOrderId?: string;
  memo: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* 환불 */
/* ------------------------------------------------------------------ */

/**
 * 실서버 결제가 쓰는 PG.
 *
 * plat-be `PgProvider` enum 그대로다.
 *
 * 주문마다 결제한 PG가 적히고 환불도 **그 PG로** 나간다. 새 주문의 PG를 바꿔도
 * 이미 받은 주문은 원래 PG로 취소되므로, 화면은 PG를 건마다 보여 준다.
 */
export type PaymentPgProvider = "TOSS" | "KAKAO_PAY" | "INICIS" | "NICE";

/** plat-be `PaymentMethod`. PG가 알려 준 결제수단이며 승인 전에는 비어 있다. */
export type PaymentOrderMethod =
  | "CARD"
  | "KAKAO_PAY"
  | "LINE_PAY"
  | "VIRTUAL_ACCOUNT";

/**
 * 환불 한 건의 돈 상태.
 *
 * - `REQUESTED`: 유저가 신청했고 **관리자 승인을 기다린다.** 돈도 노트도 아직 그대로다.
 * - `PROCESSING`: 승인해서 노트를 회수했고 PG 취소 결과를 기다린다. 판정 불가면 배치가 다시 확인한다.
 * - `COMPLETED`: PG 취소까지 끝났다.
 * - `FAILED`: PG가 취소를 확실히 거절했다. 노트가 이미 회수됐다면 사람이 되돌려야 한다.
 * - `REJECTED`: 관리자가 거절했거나, 승인 시점에 노트를 이미 써서 자동 거절됐다.
 */
export type RefundStatus =
  | "REQUESTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

/**
 * 노트 회수 상태. 돈 상태와 따로 움직인다 — "환불은 실패했는데 노트는 빠진" 건을 잡으려고 나눈다.
 * `RESTORED`는 PG가 환불을 거절해 회수한 노트를 관리자가 되돌린 상태다.
 */
export type ClawbackStatus = "NOT_STARTED" | "PENDING" | "DONE" | "FAILED" | "RESTORED";

/** 환불이 시작된 경위 */
export type RefundReasonCode =
  | "USER_REQUEST"
  | "ADMIN"
  | "CHARGEBACK"
  | "COMPENSATION";

/**
 * 거절 사유 구분.
 *
 * **노트는 신청할 때 동결하지 않는다.** 신청 시점에 미사용을 확인하고, 그 뒤에 유저가
 * 노트를 쓰면 승인 시점에 서버가 `CREDIT_USED`로 자동 거절한다. 운영자가 사유를
 * 적어 거절한 건은 `ADMIN`이다. 유저에게 나가는 문구가 달라 둘을 나눈다.
 */
export type RefundRejectReasonCode = "CREDIT_USED" | "ADMIN";

/** PG 호출 종류. `READY`는 결제창 준비, `INQUIRY`는 판정 불가 뒤 결과 조회다. */
export type PgTransactionType =
  | "READY"
  | "CONFIRM"
  | "INQUIRY"
  | "CANCEL"
  | "PARTIAL_CANCEL";

/** PG 호출 결과. 타임아웃처럼 결과를 모르는 경우를 실패와 섞지 않는다. */
export type PgTransactionResult = "SUCCESS" | "FAILED" | "IN_DOUBT";

/** 환불 목록 한 줄 */
export interface RefundListItem {
  /** Snowflake라 문자열이다. 숫자로 바꾸면 끝자리가 뭉개진다. */
  refundId: string;
  /** 사내 환불번호. 유저 문의와 PG 대조에 쓴다. */
  refundUid: string;
  status: RefundStatus;
  clawbackStatus: ClawbackStatus;
  reasonCode: RefundReasonCode;
  /** 유저가 적은 환불 사유. 비워서 신청할 수 있다. */
  reason?: string;
  rejectReasonCode?: RefundRejectReasonCode;
  /** 거절 사유 원문. 유저에게 그대로 보인다. */
  rejectReason?: string;
  /** 돌려줄 금액 (원 단위 정수). 부분 환불이 없어 결제 금액과 같다. */
  refundAmount: number;
  /** 회수할 노트 수. 신청 시점 스냅샷이다. */
  refundCredit: number;
  paymentOrderId: string;
  /** 사내 주문번호 */
  orderUid: string;
  productName: string;
  pgProvider: PaymentPgProvider;
  paymentMethod?: PaymentOrderMethod;
  /** 유저 링크는 이 값으로만 건다. */
  userId: string;
  /** 탈퇴 등으로 닉네임이 없으면 `#userId`로 채운다. */
  userNickname: string;
  /**
   * 신청한 뒤 유저가 이 결제의 노트를 썼다.
   * 이 상태로 승인하면 서버가 `CREDIT_USED`로 자동 거절한다.
   */
  creditUsedSinceRequest: boolean;
  /**
   * 완료되지 않은 채팅이 크레딧을 예약하고 있다.
   * 이 동안 승인하면 서버가 409로 막는다. 채팅이 끝나야 쓴 것인지 아닌지가 정해진다.
   */
  chatInProgress: boolean;
  requestedAt: string;
  /** 승인 · 거절한 시각 */
  decidedAt?: string;
  completedAt?: string;
  /** 승인 · 거절한 관리자. 아직 결정 전이면 없다. */
  processedBy?: string;
  processedById?: number;
}

/** PG 호출 기록 한 줄. PG마다 다른 필드 이름(카카오 tid · aid 등)은 서버가 이 모양으로 맞춘다. */
export interface PgTransaction {
  type: PgTransactionType;
  result: PgTransactionResult;
  amount: number;
  /** PG가 준 결과 코드와 메시지. 성공이면 비어 있을 수 있다. */
  pgCode?: string;
  pgMessage?: string;
  requestedAt: string;
  approvedAt?: string;
}

/* ------------------------------------------------------------------ */
/* 결제 내역 (결제 주문 통합)                                              */
/* ------------------------------------------------------------------ */

/**
 * 결제 주문의 돈 상태. plat-be `PaymentStatus` 그대로다.
 *
 * `IN_DOUBT`는 실패가 아니다. 승인 응답이 타임아웃 · 5xx로 끊겨 **돈이 빠졌는지 모르는** 상태다.
 * 실패로 적으면 청구된 결제를 영영 못 찾는다.
 */
export type PaymentStatus =
  | "PENDING"
  | "IN_DOUBT"
  | "CAPTURED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * 노트 지급 상태. plat-be `FulfillmentStatus` 그대로다.
 *
 * 돈 상태와 **따로 움직인다.** 한 축으로 묶으면 "승인됐는데 미지급"을 표현할 수 없어
 * 감지도 복구도 못 한다. "결제했는데 노트가 안 들어왔다"는 문의가 바로 이 칸이다.
 */
export type FulfillmentStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "GRANTED"
  | "DEAD"
  | "CLAWED_BACK";

/**
 * 서버가 판정한 이상 유형.
 *
 * 화면이 목록을 보고 추론하지 않는다 — 지급 대기 시간 · 환불 경과는 서버 시각으로 재야 하고, PG 대사는
 * 정산 파일이 있어야 안다. 서버가 판정해 주문에 붙여 내려 준다.
 *
 * - `NOT_GRANTED`: 돈은 들어왔는데 노트가 안 나갔다(지급 대기가 길어졌거나 재시도 소진).
 * - `IN_DOUBT`: 승인 결과를 모른다. 유저 카드에는 찍혔을 수 있다.
 * - `PG_MISMATCH`: 우리 기록과 PG 정산이 다르다(우리는 만료인데 PG는 승인 등).
 * - `REFUND_STUCK`: 환불 승인 뒤 PG 결과가 오래 확정되지 않는다.
 * - `REFUND_FAILED`: PG가 환불을 거절했다. 노트가 이미 회수됐다면 사람이 되돌려야 한다.
 */
export type PaymentAnomalyType =
  | "NOT_GRANTED"
  | "IN_DOUBT"
  | "PG_MISMATCH"
  | "REFUND_STUCK"
  | "REFUND_FAILED";

/**
 * 이상 한 건.
 *
 * **운영자가 확인하고 닫을 수 있어야 한다.** 닫지 못하면 이미 본 건이 '확인 필요'에 계속
 * 남아 탭이 쓸모없어진다. 닫아도 기록은 지우지 않는다 — 나중에 같은 유저가 다시 문의하면
 * 누가 어떻게 처리했는지가 근거다.
 */
export interface PaymentAnomaly {
  anomalyId: string;
  type: PaymentAnomalyType;
  /** 서버가 판정 근거로 남긴 한 줄. 예: "승인 후 42분째 지급 대기" */
  detail: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** 확인 처리 메모. 무엇을 보고 어떻게 정리했는지 */
  resolutionMemo?: string;
}

/** 목록 탭. 페이지를 나누는 대신 같은 결제 목록을 좁혀 보는 방법이다. */
export type PaymentOrderTab = "ALL" | "ISSUE" | "REFUND_REQUESTED" | "WITHDRAWN";

/** 결제 주문 목록 한 줄 */
export interface PaymentOrderListItem {
  /** Snowflake라 문자열이다. */
  paymentOrderId: string;
  /** 사내 주문번호 */
  orderUid: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  pgProvider: PaymentPgProvider;
  paymentMethod?: PaymentOrderMethod;
  /** PG 거래번호. 승인 전이면 없다. 파기 뒤에는 이 값이 조회 키다. */
  pgTransactionId?: string;
  platform: ProductPlatform;
  productCode: string;
  productName: string;
  /** 주문 금액 (원) */
  amount: number;
  /** 실제 승인된 금액. 승인 전이면 0이다. */
  paidAmount: number;
  /** 환불된 금액 누계 */
  refundedAmount: number;
  /** 지급할 노트 (보너스 포함) */
  creditAmount: number;
  /**
   * 결제한 유저. 결제 기록의 유저 ID는 FK 없는 회계 키라 **탈퇴 뒤에도 남는다.**
   * 유저 링크는 이 값으로만 건다(탈퇴했으면 링크가 없다).
   */
  userId: string;
  /** 탈퇴해 유저 행이 사라졌으면 비어 있다. */
  userNickname?: string;
  isWithdrawn: boolean;
  /** 아직 닫지 않은 이상. '확인 필요' 탭은 이 값이 있는 주문이다. */
  openAnomalyTypes: PaymentAnomalyType[];
  /** 가장 최근 환불 요청의 상태. 요청이 없으면 비어 있다. */
  refundStatus?: RefundStatus;
  /**
   * 승인 대기 중인 환불의 **신청 뒤 사용한 노트 합계.** 0보다 크면 승인 불가다.
   * 목록에서 바로 보여야 한다 — 상세를 열어 봐야 알면 대기 건을 훑다 놓친다.
   */
  refundCreditUsedSinceRequest?: number;
  /** 승인 대기 중인 환불에 채팅이 크레딧을 예약하고 있다. 끝나기 전에는 승인이 막힌다. */
  refundChatInProgress?: boolean;
  /** 보존 만료일 (결제일 + 5년). 이 날이 지나면 주문도 파기 대상이다. */
  retentionUntil: string;
  requestedAt: string;
  paidAt?: string;
}

/** 타임라인 한 줄의 결과 성격. 배지 색으로 옮긴다. */
export type PaymentEventTone = "neutral" | "info" | "success" | "warning" | "danger";

/** 타임라인 한 줄의 주체 */
export type PaymentEventActor = "USER" | "PG" | "SYSTEM" | "ADMIN";

/**
 * 결제 한 건에 일어난 일을 시간순으로 한 줄씩.
 *
 * 서버의 여러 표(주문 · PG 호출 · 크레딧 원장 · 환불 · 이상)를 한 줄로 합친 것이다.
 * 운영자는 "무슨 일이 어떤 순서로 있었나"를 묻지, 표 이름을 묻지 않는다.
 */
export interface PaymentTimelineEvent {
  occurredAt: string;
  actor: PaymentEventActor;
  title: string;
  description?: string;
  tone: PaymentEventTone;
}

/** 이 결제로 크레딧 원장에 찍힌 줄 */
export interface PaymentCreditEntry {
  ledgerId: string;
  type: LedgerType;
  creditDelta: number;
  memo: string;
  createdAt: string;
}

/**
 * 이 결제로 받은 노트가 어떻게 쓰였는가.
 *
 * 노트는 지갑 하나에 합쳐져 빠지므로 "그 결제의 노트가 쓰였나"는 서버의 **풀 차감 기록**으로만
 * 줄 단위로 보인다. 환불은 전액 회수라 한 개라도 빠졌으면 승인해도 자동 거절된다.
 */
export interface PaymentPoolUsage {
  totalAmount: number;
  remainingAmount: number;
  /** 이 결제의 풀에서 빠진 줄. `creditDelta`는 원장 금액이 아니라 이 풀이 낸 몫(음수)이다. */
  entries: PaymentCreditEntry[];
  /** 차감 기록이 생기기 전에 빠진 양. 줄로 보여 줄 수 없어 합계만 온다. */
  unrecordedAmount: number;
}

/** 이 결제에 걸린 환불. 환불 목록 한 줄과 같은 모양에 판단 근거가 붙는다. */
export type PaymentOrderRefund = PaymentOrderRefundBase & {
  /** 이 결제가 만든 풀의 사용 내역. 노트 지급 전이라 풀이 없으면 비어 있다. */
  poolUsage?: PaymentPoolUsage;
};

type PaymentOrderRefundBase = Pick<
  RefundListItem,
  | "refundId"
  | "refundUid"
  | "status"
  | "clawbackStatus"
  | "reasonCode"
  | "reason"
  | "rejectReasonCode"
  | "rejectReason"
  | "refundAmount"
  | "refundCredit"
  | "creditUsedSinceRequest"
  | "chatInProgress"
  | "requestedAt"
  | "decidedAt"
  | "completedAt"
  | "processedBy"
  | "processedById"
>;

/** 결제 상세 */
export interface PaymentOrderDetail extends PaymentOrderListItem {
  baseCredits: number;
  bonusCredits: number;
  refundedCredit: number;
  currency: ProductCurrency;
  /** 결제창 유효시간. 이때까지 승인이 없으면 만료된다. */
  expiresAt: string;
  closedAt?: string;
  /** 환불 신청 기한 */
  refundableUntil?: string;
  failureCode?: string;
  failureMessage?: string;
  cashReceiptNumber?: string;
  /** 카드 승인번호. 카드 결제가 아니면 없다. 카드사 · PG 문의에 쓴다. */
  approvalNo?: string;
  /** 카드사 이름. 카드번호는 남기지 않는다. */
  cardIssuer?: string;
  /** 할부 개월. 0은 일시불 */
  installmentMonths?: number;
  /** 부가세. 공급가액은 `paidAmount - vatAmount`. PG가 알려 주지 않았으면 비어 있다. */
  vatAmount?: number;
  /** PG가 발급한 영수증. 원본 확인이 필요할 때 여기로 간다. */
  receiptUrl?: string;
  /**
   * 유저의 **지금** 크레딧 잔액. 탈퇴해 지갑이 없으면 없다.
   * 노트는 결제별로 따로 쌓이지 않고 지갑 하나에 합쳐진다. 회수할 노트보다 잔액이
   * 적으면 회수가 불가능하므로, 환불 판단에 이 값이 함께 있어야 한다.
   */
  userCreditBalance?: number;
  anomalies: PaymentAnomaly[];
  refunds: PaymentOrderRefund[];
  pgTransactions: PgTransaction[];
  creditEntries: PaymentCreditEntry[];
  timeline: PaymentTimelineEvent[];
}

/** 탭 옆 숫자와 상단 경고에 쓰는 건수 */
export interface PaymentOrderSummary {
  /** 90일 안에 보존 기간이 끝나는 주문. 파기 배치 전에 확인한다. */
  retentionExpiringCount: number;
  /** 닫지 않은 이상이 있는 주문 수 */
  issueCount: number;
  /** 유형별로 나눈 건수. 한 주문에 둘이 걸리면 양쪽에 센다. */
  issueCountByType: Record<PaymentAnomalyType, number>;
  refundRequestedCount: number;
  withdrawnCount: number;
  /** 오늘(KST) 승인된 금액에서 환불을 뺀 값 */
  todayNetAmount: number;
}

/**
 * 관리자가 먼저 거는 환불의 경위. plat-be `RefundReasonCode`의 부분집합이다.
 *
 * 유저 요청 환불(`USER_REQUEST`)과 달리 **승인 단계가 없다** — 거는 사람이 곧 승인자다.
 * 고객센터로 들어온 요청 · PG 대사 불일치처럼 유저 신청 절차 없이 우리가 바로잡을 건을 위해 둔다.
 * 기한(결제 후 7일)도 보지 않는다. 우리 잘못을 바로잡는 일이라 유저 기한에 묶이면 안 된다.
 */
export type AdminRefundReasonCode = "ADMIN" | "COMPENSATION";
