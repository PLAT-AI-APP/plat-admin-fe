import type { RefundRejectReasonCode, RefundStatus } from "@/type/billing";

/**
 * 커뮤니케이션 도메인 타입.
 * Q&A · FAQ는 실서버 계약을 따른다. 나머지(알림 · 선제 메시지 · 푸시)는 MOCK 범위지만,
 * 나중에 켜기만 하면 되도록 화면과 타입을 미리 구현한다.
 */

/** Q&A */
export type QnaStatus = "OPEN" | "ANSWERED";
export type QnaCategory =
  | "REFUND"
  | "ACCOUNT"
  | "PAYMENT"
  | "CHARACTER"
  | "BUG"
  | "ETC";

/**
 * 환불 문의에 묶인 환불 요청.
 *
 * 유저가 환불을 신청하면 서버가 `REFUND` 문의를 함께 연다. 이 블록은 관리자에게만 보이는 환불의
 * 지금 상태다 — 유저에게는 환불 결과가 자동으로 전달되지 않고, 관리자가 답변으로 직접 알린다.
 * 환불 처리 자체(노트 회수, PG 취소)는 결제 도메인이 그대로 맡는다.
 * 값은 서버가 환불 표에서 실시간으로 읽어 채운다.
 */
export interface QnaRefundLink {
  /** Snowflake. 결제 상세(`/billing/payments/[orderId]`)로 이어진다. */
  paymentOrderId: string;
  orderUid: string;
  refundId: string;
  productName: string;
  /** 최소 단위 정수. 결제 상세의 `refundAmount`와 같은 의미다. */
  refundAmount: number;
  refundCredit: number;
  status: RefundStatus;
  rejectReasonCode: RefundRejectReasonCode | null;
  /** 거절 사유. 결제 기록으로만 남고 유저에게는 자동으로 보이지 않는다. */
  rejectReason: string | null;
  requestedAt: string;
  decidedAt: string | null;
  /**
   * PG 실패 뒤 회수했던 노트를 유저에게 되돌렸는지(clawback RESTORED).
   * `FAILED`이면서 `true`면 "환불 불가"로 확정된 것이고, `false`면 결제 상세에서 마무리할 일이 남았다.
   */
  creditRestored: boolean;
}

export interface QnaItem {
  /** Snowflake. 문자열 그대로 다룬다. */
  qnaId: string;
  category: QnaCategory;
  title: string;
  content: string;
  status: QnaStatus;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  userId: string;
  /** 탈퇴 등으로 유저가 없으면 서버가 "(알 수 없음)"으로 채운다. */
  userNickname: string;
  answer: string | null;
  answeredBy: string | null;
  /** 답변 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  answeredById: number | null;
  answeredAt: string | null;
  createdAt: string;
  /** `REFUND` 문의에만 있다. */
  refund: QnaRefundLink | null;
}

/** 자주 하는 질문 */
export type FaqCategory =
  | "ACCOUNT"
  | "PAYMENT"
  | "REFUND"
  | "CHARACTER"
  | "CHAT"
  | "ETC";

export interface FaqItem {
  faqId: string;
  category: FaqCategory;
  question: string;
  answer: string;
  /** 유저 화면 노출 여부 */
  isVisible: boolean;
  /** 같은 카테고리 안에서 작을수록 위에 보인다. */
  sortOrder: number;
  /** 수정 이력이 없으면 서버가 작성자로 채운다. */
  updatedBy: string;
  /** 수정 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  updatedById: number | null;
  /** 수정 이력이 없으면 서버가 작성일로 채운다. */
  updatedAt: string;
}

export interface FaqFormValues {
  category: FaqCategory;
  question: string;
  answer: string;
  isVisible: boolean;
}

/** 알림 템플릿 */
export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL";

export interface NotificationTemplate {
  templateId: number;
  templateKey: string;
  label: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  isEnabled: boolean;
  updatedAt: string;
}

/** 선제 메시지 */
export type ProactiveTrigger =
  | "NO_CHAT_3DAYS"
  | "NO_CHAT_7DAYS"
  | "AFTER_FIRST_CHAT"
  | "CUSTOM";

export interface ProactiveMessage {
  messageId: number;
  /**
   * 대상 캐릭터. 비어 있으면 모든 캐릭터에 쓰는 공용 메시지다.
   * 캐릭터 ID는 Snowflake라 문자열 그대로 다룬다 — 이 도메인이 목업이어도 가리키는 대상은 실서버 ID다.
   */
  characterId?: string;
  characterName?: string;
  trigger: ProactiveTrigger;
  content: string;
  isEnabled: boolean;
  sentCount: number;
  updatedAt: string;
}

/** 푸시 발송 */
export type PushStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";
export type PushTarget = "ALL" | "ACTIVE_USERS" | "DORMANT_USERS" | "SEGMENT";

export interface PushCampaign {
  campaignId: number;
  title: string;
  body: string;
  target: PushTarget;
  status: PushStatus;
  scheduledAt?: string;
  sentAt?: string;
  targetCount: number;
  successCount: number;
  createdBy: string;
  /** 등록 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  createdById?: number;
  createdAt: string;
}
