import type {
  FaqCategory,
  NotificationChannel,
  ProactiveTrigger,
  PushStatus,
  PushTarget,
  QnaCategory,
  QnaStatus,
} from "@/type/communication";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type { TabItem } from "@/components/ui/Tabs";

/**
 * 커뮤니케이션 화면 공통 라벨 맵.
 * 서버 enum 값을 화면에 그대로 노출하지 않기 위해 한 곳에서만 한국어로 옮긴다.
 */

/* ------------------------------- Q&A ------------------------------- */

export const QNA_STATUS_LABEL: Record<QnaStatus, string> = {
  OPEN: "답변 대기",
  ANSWERED: "답변 완료",
  CANCELLED: "취소",
};

export const QNA_STATUS_TONE: Record<QnaStatus, BadgeTone> = {
  OPEN: "warning",
  ANSWERED: "success",
  /* 유저가 거둔 문의. 처리할 일이 없으므로 눈에 띄지 않게 둔다. */
  CANCELLED: "neutral",
};

export const QNA_CATEGORY_LABEL: Record<QnaCategory, string> = {
  REFUND: "환불",
  ACCOUNT: "계정",
  PAYMENT: "결제",
  CHARACTER: "캐릭터",
  BUG: "오류 신고",
  ETC: "기타",
};

/**
 * 카테고리 색.
 * 목록에서 어떤 성격의 문의가 몰려 있는지 색만 보고 훑을 수 있어야 하므로
 * 카테고리마다 다른 톤을 준다. 오류 신고는 장애로 이어질 수 있어 가장 눈에 띄는
 * `danger`, 결제는 금전이 얽혀 `warning`을 쓴다.
 */
export const QNA_CATEGORY_TONE: Record<QnaCategory, BadgeTone> = {
  /* 환불은 승인·거절이 필요한 처리 건이라 일반 결제 문의와 구분되는 `danger`를 쓴다. */
  REFUND: "danger",
  ACCOUNT: "info",
  PAYMENT: "warning",
  CHARACTER: "brand",
  BUG: "danger",
  ETC: "neutral",
};

/** 상태 탭. 빈 문자열은 전체 조회를 의미한다. */
export const QNA_STATUS_TABS: TabItem<QnaStatus | "">[] = [
  { label: "전체", value: "" },
  { label: QNA_STATUS_LABEL.OPEN, value: "OPEN" },
  { label: QNA_STATUS_LABEL.ANSWERED, value: "ANSWERED" },
  { label: QNA_STATUS_LABEL.CANCELLED, value: "CANCELLED" },
];

export const QNA_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "전체 카테고리", value: "" },
  ...(Object.keys(QNA_CATEGORY_LABEL) as QnaCategory[]).map((category) => ({
    label: QNA_CATEGORY_LABEL[category],
    value: category,
  })),
];

/* ------------------------------- FAQ ------------------------------- */

/** 키 순서가 곧 선택지 순서다. 서버 enum 선언 순서(= 고객센터 노출 순서)와 맞춘다. */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, string> = {
  SERVICE: "서비스 이용",
  ACCOUNT: "계정",
  VERIFICATION: "본인·성인인증",
  PAYMENT: "결제·노트",
  REFUND: "환불",
  CHARACTER: "캐릭터",
  CHAT: "대화",
  CREATOR: "제작·수익",
  REPORT: "신고·제재",
  ETC: "기타",
};

export const FAQ_CATEGORY_TONE: Record<FaqCategory, BadgeTone> = {
  SERVICE: "neutral",
  ACCOUNT: "info",
  VERIFICATION: "info",
  PAYMENT: "warning",
  REFUND: "danger",
  CHARACTER: "brand",
  CHAT: "success",
  CREATOR: "brand",
  REPORT: "danger",
  ETC: "neutral",
};

export const FAQ_CATEGORY_OPTIONS: SelectOption[] = (
  Object.keys(FAQ_CATEGORY_LABEL) as FaqCategory[]
).map((category) => ({
  label: FAQ_CATEGORY_LABEL[category],
  value: category,
}));

export const FAQ_CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 카테고리", value: "" },
  ...FAQ_CATEGORY_OPTIONS,
];

/* --------------------------- 알림 템플릿 --------------------------- */

export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  IN_APP: "앱 내 알림",
  PUSH: "푸시",
  EMAIL: "이메일",
};

export const NOTIFICATION_CHANNEL_TONE: Record<NotificationChannel, BadgeTone> =
  {
    IN_APP: "brand",
    PUSH: "info",
    EMAIL: "neutral",
  };

/** 템플릿 본문에서 사용할 수 있는 치환 변수 안내 */
export const NOTIFICATION_VARIABLES = [
  "{nickname}",
  "{characterName}",
  "{credit}",
  "{chatCount}",
  "{days}",
];

/* ---------------------------- 선제 메시지 ---------------------------- */

export const PROACTIVE_TRIGGER_LABEL: Record<ProactiveTrigger, string> = {
  NO_CHAT_3DAYS: "3일 미접속",
  NO_CHAT_7DAYS: "7일 미접속",
  AFTER_FIRST_CHAT: "첫 대화 직후",
  CUSTOM: "직접 지정",
};

export const PROACTIVE_TRIGGER_TONE: Record<ProactiveTrigger, BadgeTone> = {
  NO_CHAT_3DAYS: "warning",
  NO_CHAT_7DAYS: "danger",
  AFTER_FIRST_CHAT: "success",
  CUSTOM: "neutral",
};

export const PROACTIVE_TRIGGER_OPTIONS: SelectOption[] = (
  Object.keys(PROACTIVE_TRIGGER_LABEL) as ProactiveTrigger[]
).map((trigger) => ({
  label: PROACTIVE_TRIGGER_LABEL[trigger],
  value: trigger,
}));

/* ---------------------------- 푸시 발송 ---------------------------- */

export const PUSH_STATUS_LABEL: Record<PushStatus, string> = {
  DRAFT: "임시 저장",
  SCHEDULED: "예약",
  SENT: "발송 완료",
  FAILED: "발송 실패",
};

export const PUSH_STATUS_TONE: Record<PushStatus, BadgeTone> = {
  DRAFT: "neutral",
  SCHEDULED: "info",
  SENT: "success",
  FAILED: "danger",
};

export const PUSH_TARGET_LABEL: Record<PushTarget, string> = {
  ALL: "전체 유저",
  ACTIVE_USERS: "활성 유저",
  DORMANT_USERS: "휴면 유저",
  SEGMENT: "지정 세그먼트",
};

export const PUSH_STATUS_OPTIONS: SelectOption[] = [
  { label: "전체 상태", value: "" },
  ...(Object.keys(PUSH_STATUS_LABEL) as PushStatus[]).map((status) => ({
    label: PUSH_STATUS_LABEL[status],
    value: status,
  })),
];

export const PUSH_TARGET_OPTIONS: SelectOption[] = (
  Object.keys(PUSH_TARGET_LABEL) as PushTarget[]
).map((target) => ({
  label: PUSH_TARGET_LABEL[target],
  value: target,
}));
