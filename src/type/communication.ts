/**
 * 커뮤니케이션 도메인 타입.
 * 전부 MOCK 범위지만, 나중에 켜기만 하면 되도록 화면과 타입을 미리 구현한다.
 */

/** Q&A */
export type QnaStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type QnaCategory = "ACCOUNT" | "PAYMENT" | "CHARACTER" | "BUG" | "ETC";

export interface QnaItem {
  qnaId: number;
  category: QnaCategory;
  title: string;
  content: string;
  status: QnaStatus;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  userId: string;
  userNickname: string;
  answer?: string;
  answeredBy?: string;
  /** 답변 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  answeredById?: number;
  answeredAt?: string;
  createdAt: string;
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
  characterId?: number;
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
