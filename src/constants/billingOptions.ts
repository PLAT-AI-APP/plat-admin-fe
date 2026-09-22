import dayjs from "@/lib/dayjs";
import type {
  AdjustmentType,
  AdminRefundReasonCode,
  ClawbackStatus,
  FulfillmentStatus,
  LedgerType,
  PaymentAnomalyType,
  PaymentEventActor,
  PaymentStatus,
  PaymentOrderMethod,
  PaymentPgProvider,
  PgTransactionResult,
  PgTransactionType,
  RefundReasonCode,
  RefundRejectReasonCode,
  RefundStatus,
} from "@/type/billing";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

/* ------------------------------------------------------------------ */
/* 크레딧 수동 조정 */
/* ------------------------------------------------------------------ */

/** 조정 유형 표기 — 화면에는 원문 enum 대신 이 라벨만 노출한다. */
export const ADJUSTMENT_TYPE_LABEL: Record<AdjustmentType, string> = {
  GRANT: "지급",
  DEDUCT: "차감",
};

export const ADJUSTMENT_TYPE_TONE: Record<AdjustmentType, BadgeTone> = {
  GRANT: "success",
  DEDUCT: "danger",
};

/**
 * 조정 유형별 부호.
 * 표·확인 문구에서 금액 앞에 붙여 지급인지 차감인지 눈으로 먼저 읽게 한다.
 */
export const ADJUSTMENT_TYPE_SIGN: Record<AdjustmentType, string> = {
  GRANT: "+",
  DEDUCT: "-",
};

export const ADJUSTMENT_TYPE_OPTIONS: SelectOption[] = (
  Object.keys(ADJUSTMENT_TYPE_LABEL) as AdjustmentType[]
).map((type) => ({
  label: ADJUSTMENT_TYPE_LABEL[type],
  value: type,
}));

/** 목록 필터용. 전체 조회는 빈 값으로 보낸다. */
export const ADJUSTMENT_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 유형", value: "" },
  ...ADJUSTMENT_TYPE_OPTIONS,
];

/* ------------------------------------------------------------------ */
/* 크레딧 장부 */
/* ------------------------------------------------------------------ */

/** 장부 유형 표기 — 화면에는 원문 enum 대신 이 라벨만 노출한다. */
export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  PAYMENT: "결제",
  CHARGE: "충전",
  USE: "사용",
  REFUND: "환불",
  EXPIRE: "만료",
  ADJUSTMENT: "수동 조정",
};

export const LEDGER_TYPE_TONE: Record<LedgerType, BadgeTone> = {
  PAYMENT: "brand",
  CHARGE: "info",
  USE: "neutral",
  REFUND: "danger",
  /* 만료는 사고가 아니라 정책대로 일어난 일이라 경고색을 쓰지 않는다. */
  EXPIRE: "neutral",
  ADJUSTMENT: "warning",
};

/* ------------------------------------------------------------------ */
/* 결제 기록 보존 */
/* ------------------------------------------------------------------ */

/**
 * 보존 근거.
 *
 * 화면에 그대로 적는다. 이 원장은 "지우지 않고 들고 있는 개인 거래 기록"이라
 * **왜 남아 있는지가 화면에 없으면 곤란한 자료**다. 감사·실사에서 가장 먼저
 * 확인하는 것도 근거 조항이다.
 */
export const RETENTION_BASIS =
  "전자상거래 등에서의 소비자보호에 관한 법률 제6조 · 같은 법 시행령 제6조 (대금결제 및 재화 등의 공급에 관한 기록)";

/** 보존 만료가 이만큼 남으면 화면에서 따로 표시한다. */
export const EXPIRING_DAYS = 90;

/**
 * 보존 만료까지 남은 일수. 음수면 이미 파기 대상이다.
 *
 * 만료일만 적어 두면 운영자가 매번 오늘 날짜와 빼 봐야 한다. 파기 배치를 언제
 * 돌릴지 판단하는 자리라 남은 기간을 화면이 대신 계산해 준다.
 */
export const retentionDaysLeft = (retentionUntil: string): number =>
  dayjs(retentionUntil).startOf("day").diff(dayjs().startOf("day"), "day");

/* ------------------------------------------------------------------ */
/* 환불 */
/* ------------------------------------------------------------------ */

/** 실서버 PG 이름. 보존 원장 목업의 `PG_PROVIDER_LABEL`과 키가 다르다. */
export const PAYMENT_PG_PROVIDER_LABEL: Record<PaymentPgProvider, string> = {
  KAKAO_PAY: "카카오페이",
  TOSS: "토스페이먼츠",
  INICIS: "KG이니시스",
  NICE: "나이스페이먼츠",
};

export const PAYMENT_PG_PROVIDER_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 PG", value: "" },
  ...(Object.keys(PAYMENT_PG_PROVIDER_LABEL) as PaymentPgProvider[]).map(
    (provider) => ({ label: PAYMENT_PG_PROVIDER_LABEL[provider], value: provider }),
  ),
];

export const PAYMENT_ORDER_METHOD_LABEL: Record<PaymentOrderMethod, string> = {
  CARD: "카드",
  KAKAO_PAY: "카카오페이머니",
  LINE_PAY: "LINE Pay",
  VIRTUAL_ACCOUNT: "가상계좌",
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  REQUESTED: "승인 대기",
  PROCESSING: "처리 중",
  COMPLETED: "완료",
  FAILED: "실패",
  REJECTED: "거절",
};

export const REFUND_STATUS_TONE: Record<RefundStatus, BadgeTone> = {
  REQUESTED: "warning",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
  REJECTED: "neutral",
};

export const CLAWBACK_STATUS_LABEL: Record<ClawbackStatus, string> = {
  NOT_STARTED: "회수 전",
  PENDING: "회수 중",
  DONE: "회수됨",
  FAILED: "회수 실패",
  RESTORED: "노트 복구됨",
};

export const REFUND_REJECT_REASON_LABEL: Record<RefundRejectReasonCode, string> = {
  CREDIT_USED: "크레딧 사용",
  ADMIN: "관리자 거절",
};

/**
 * 자동 거절 때 유저에게 나가는 문구.
 * 서버 메시지가 원본이고, 이 값은 서버가 사유 원문을 비워 보낸 경우의 대체 표기다.
 */
export const REFUND_CREDIT_USED_MESSAGE =
  "크레딧을 사용하여 환불이 거절되었습니다.";

/** 채팅이 크레딧을 예약 중이라 승인할 수 없을 때 서버가 409와 함께 주는 코드 */
export const REFUND_CHAT_IN_PROGRESS_CODE = "PAYMENT_REFUND_CHAT_IN_PROGRESS";

/** 채팅이 크레딧을 예약 중일 때. 서버 409 문구와 같은 뜻으로 맞춘다. */
export const REFUND_CHAT_IN_PROGRESS_MESSAGE =
  "유저에게 완료되지 않은 채팅이 있어 크레딧이 예약 중입니다. 채팅이 끝난 뒤 다시 승인해 주세요.";

/** 거절 사유 입력 최대 길이. 서버 `reject_reason VARCHAR(255)`에 맞춘다. */
export const REFUND_REJECT_REASON_MAX_LENGTH = 255;

/** 자주 쓰는 거절 사유. 유저에게 그대로 보이므로 문장으로 적는다. */
export const REFUND_REJECT_REASON_PRESETS: string[] = [
  "환불 정책(결제 후 7일 이내, 미사용)에 해당하지 않아 환불이 어렵습니다.",
  "이미 제공된 혜택이 있어 환불이 어렵습니다.",
  "동일 결제로 환불이 이미 처리되었습니다.",
];

export const PG_TRANSACTION_TYPE_LABEL: Record<PgTransactionType, string> = {
  READY: "결제 준비",
  CONFIRM: "승인",
  INQUIRY: "결과 조회",
  CANCEL: "취소",
  PARTIAL_CANCEL: "부분 취소",
};

export const PG_TRANSACTION_RESULT_LABEL: Record<PgTransactionResult, string> = {
  SUCCESS: "성공",
  FAILED: "실패",
  IN_DOUBT: "판정 불가",
};

export const PG_TRANSACTION_RESULT_TONE: Record<PgTransactionResult, BadgeTone> = {
  SUCCESS: "success",
  FAILED: "danger",
  IN_DOUBT: "warning",
};

/* ------------------------------------------------------------------ */
/* 결제 내역 (결제 주문 통합) */
/* ------------------------------------------------------------------ */

/** 돈 상태. 유저가 카드 명세서에서 보는 것과 같은 말로 옮긴다. */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "결제창 대기",
  IN_DOUBT: "승인 확인 중",
  CAPTURED: "결제 완료",
  PARTIALLY_REFUNDED: "부분 환불",
  REFUNDED: "환불 완료",
  FAILED: "결제 실패",
  CANCELLED: "취소",
  EXPIRED: "만료",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: "neutral",
  IN_DOUBT: "warning",
  CAPTURED: "success",
  PARTIALLY_REFUNDED: "info",
  REFUNDED: "neutral",
  FAILED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

export const PAYMENT_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((status) => ({
    label: PAYMENT_STATUS_LABEL[status],
    value: status,
  })),
];

export const FULFILLMENT_STATUS_LABEL: Record<FulfillmentStatus, string> = {
  NOT_STARTED: "지급 전",
  PENDING: "지급 대기",
  GRANTED: "지급 완료",
  DEAD: "지급 실패",
  CLAWED_BACK: "회수됨",
};

/** 목록 배지에 쓰는 짧은 이름. 운영자가 문의를 받았을 때 쓰는 말과 맞춘다. */
export const PAYMENT_ANOMALY_LABEL: Record<PaymentAnomalyType, string> = {
  NOT_GRANTED: "노트 미지급",
  IN_DOUBT: "승인 결과 모름",
  PG_MISMATCH: "PG 대사 불일치",
  REFUND_STUCK: "환불 지연",
  REFUND_FAILED: "환불 실패",
};

/**
 * 이상 유형별 안내. 상세 상단 경고에 그대로 쓴다.
 *
 * 무엇이 이상한지보다 **운영자가 지금 무엇을 하면 되는지**를 먼저 쓴다. 판정 근거는
 * 서버가 준 `detail`이 따로 붙는다.
 */
export const PAYMENT_ANOMALY_GUIDE: Record<PaymentAnomalyType, string> = {
  NOT_GRANTED:
    "돈은 들어왔는데 노트가 나가지 않았습니다. '지급 재시도'로 이 주문의 지급을 다시 돌려 주세요. 크레딧 수동 조정으로 주면 나중에 배치가 성공했을 때 두 번 지급됩니다.",
  IN_DOUBT:
    "PG 승인 응답이 끊겨 돈이 빠졌는지 모릅니다. 'PG 결과 조회'로 다시 물어 보세요. PG 관리자 화면에서 따로 취소하면 이중 처리될 수 있습니다.",
  PG_MISMATCH:
    "우리는 결제창 만료로 닫았는데 PG는 승인했습니다. 돈만 빠지고 노트는 안 나간 상태입니다. 결제를 살리려면 'PG 승인 인정'으로 노트를 지급하고, 돌려주려면 PG 관리자 화면에서 취소한 뒤 'PG 직접 취소 기록'을 남겨 주세요.",
  REFUND_STUCK:
    "환불을 승인했지만 PG 결과가 오래 확정되지 않았습니다. 'PG 결과 조회'로 다시 물어 보세요. PG에서 직접 취소하지 마세요.",
  REFUND_FAILED:
    "PG가 환불을 거절했습니다. 노트는 이미 회수됐고 돈은 돌아가지 않았습니다. PG 관리자 화면에서 직접 취소했다면 'PG 직접 취소 기록'을, 환불을 포기한다면 '노트 되돌리기'로 원상복구해 주세요.",
};

/**
 * '확인 필요' 안에서 유형으로 좁히는 순서.
 * 유저가 돈을 잃고 있는 것부터 둔다.
 */
export const PAYMENT_ANOMALY_ORDER: PaymentAnomalyType[] = [
  "NOT_GRANTED",
  "IN_DOUBT",
  "REFUND_FAILED",
  "PG_MISMATCH",
  "REFUND_STUCK",
];

export const PAYMENT_EVENT_ACTOR_LABEL: Record<PaymentEventActor, string> = {
  USER: "유저",
  PG: "PG",
  SYSTEM: "시스템",
  ADMIN: "관리자",
};

/**
 * 이상 유형별로 운영자가 바로 누를 수 있는 조치.
 *
 * 조치가 성공하면 서버가 그 이상을 **스스로 닫는다.** '확인 처리'는 조치가 없는 유형이거나
 * 조치 없이 끝내는 경우(PG 관리자 화면에서 확인만 한 건 등)에만 쓴다.
 */
export type PaymentAnomalyAction =
  | "RETRY_FULFILLMENT"
  | "PG_INQUIRY"
  | "ACCEPT_PG_CAPTURE"
  | "RECORD_MANUAL_CANCEL"
  | "RESTORE_CREDIT";

/**
 * 모든 유형에 조치가 하나 이상 있다. **'확인 처리'만 남는 유형이 있으면 운영자가 PG 관리자
 * 화면에서 고친 뒤 메모 한 줄로 끝내게 되는데, 그러면 돈 · 노트 상태가 우리 쪽에서 안 바뀐다.**
 * PG에서 직접 한 일도 여기서 기록해야 결제 상태가 실제와 맞는다.
 */
export const PAYMENT_ANOMALY_ACTIONS: Record<PaymentAnomalyType, PaymentAnomalyAction[]> = {
  NOT_GRANTED: ["RETRY_FULFILLMENT"],
  IN_DOUBT: ["PG_INQUIRY"],
  REFUND_STUCK: ["PG_INQUIRY"],
  PG_MISMATCH: ["ACCEPT_PG_CAPTURE", "RECORD_MANUAL_CANCEL"],
  REFUND_FAILED: ["RECORD_MANUAL_CANCEL", "RESTORE_CREDIT"],
};

export const PAYMENT_ANOMALY_ACTION_LABEL: Record<PaymentAnomalyAction, string> = {
  RETRY_FULFILLMENT: "지급 재시도",
  PG_INQUIRY: "PG 결과 조회",
  ACCEPT_PG_CAPTURE: "PG 승인 인정",
  RECORD_MANUAL_CANCEL: "PG 직접 취소 기록",
  RESTORE_CREDIT: "노트 되돌리기",
};

export const ADMIN_REFUND_REASON_LABEL: Record<AdminRefundReasonCode, string> = {
  ADMIN: "운영 조치 (고객센터 요청 · 오결제)",
  COMPENSATION: "장애 보상",
};

/** 환불이 시작된 경위. 유저가 신청한 건과 우리가 먼저 돌려준 건은 통계와 분쟁 대응이 다르다. */
export const REFUND_REASON_CODE_LABEL: Record<RefundReasonCode, string> = {
  USER_REQUEST: "유저 요청",
  ADMIN: "운영 조치",
  CHARGEBACK: "카드사 이의제기",
  COMPENSATION: "장애 보상",
};

/** 보존 기간 필터. 주소에 실리므로 boolean이 아니라 문자열 값이다. */
export const RETENTION_FILTER_OPTIONS: SelectOption[] = [
  { label: "보존 기간 전체", value: "" },
  { label: `만료 ${EXPIRING_DAYS}일 이내`, value: "EXPIRING" },
];

/** 확인 처리 메모 최대 길이 */
export const PAYMENT_ANOMALY_MEMO_MAX_LENGTH = 500;
