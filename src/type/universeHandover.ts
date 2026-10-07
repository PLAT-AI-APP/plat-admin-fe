/**
 * 탈퇴 캐릭터 인수 심사.
 *
 * 제작자가 탈퇴하며 이용허락과 함께 남긴 세계관(서버 `universe`)은 인수 대기(`ORPHANED`)로
 * 운영 심사를 기다린다. 승인하면 고른 공식 계정이 세계관과 이미지 소유를 넘겨받아 운영하고,
 * 반려하면 세계관이 삭제된다. 14일 안에 처리하지 않으면 시스템이 만료(`EXPIRED`)로 닫는다.
 */

/** 심사 상태. 서버 `UniverseHandoverStatus`와 같다. `PENDING`에서 한 번만 닫힌다. */
export type UniverseHandoverStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

/** 반려 사유. 서버 `UniverseHandoverReason`과 같다. `EXPIRED`는 기한 배치만 쓴다. */
export type UniverseHandoverReason =
  | "REAL_PERSON"
  | "ORIGINAL_IP"
  | "STOLEN_IMAGE"
  | "PERSONAL_INFO"
  | "REPORT_HISTORY"
  | "OTHER"
  | "EXPIRED";

/** 운영자가 고를 수 있는 반려 사유. */
export type UniverseHandoverRejectReason = Exclude<
  UniverseHandoverReason,
  "EXPIRED"
>;

/** 이용허락한 제작자가 성년임을 무엇으로 확인했는지. 서버 `HandoverAgeBasis`와 같다. */
export type HandoverAgeBasis = "BIRTH" | "SELF_ATTESTED";

/**
 * 인수 심사 한 건.
 *
 * 원 제작자는 탈퇴해 닉네임이 없다. 인수 번호와 세계관으로만 가린다.
 * 신고 · 방 수는 **탈퇴 시점 스냅샷**이다 — 탈퇴하면 그 계정이 피신고자인 신고가 지워진다.
 * ID는 Snowflake라 문자열, 시각은 UTC ISO 문자열로 온다.
 */
export interface UniverseHandover {
  handoverId: string;
  universeId: string;
  /** 세계관이 파기돼 제목이 없으면 null. */
  universeTitle: string | null;
  /** 세계관 대표 이미지. 실존 인물 · 도용 이미지 심사에 쓴다. 파기돼 없으면 null. */
  profileImageFileId: string | null;
  status: UniverseHandoverStatus;
  consentDocumentId: string;
  consentVersion: string;
  consentedAt: string;
  ageBasis: HandoverAgeBasis;
  /** 이 시각까지 처리하지 않으면 시스템이 만료로 닫는다. */
  deadlineAt: string;
  /** 원 제작자가 아닌 유저의 채팅방 수. 인수하면 이 대화가 이어진다. */
  otherRoomCount: number;
  reportCaseCount: number;
  reportCount: number;
  /** 아직 처리하지 않은(PENDING) 케이스의 신고 수. */
  pendingReportCount: number;
  /** 인수한 공식 계정(승인 건). */
  targetUserId: string | null;
  targetNickname: string | null;
  reasonCode: UniverseHandoverReason | null;
  handlerNote: string | null;
  /** 처리한 관리자 이름. 시스템 처리(만료)는 "SYSTEM". */
  handlerName: string | null;
  handledAt: string | null;
}

/**
 * 심사 건의 제작자가 동의한 동의서 원문(한국어 원본)과 동의 시각.
 * 인수 심사 권한으로 본다 — 법무 문서 권한(`legal:read`)은 필요 없다.
 */
export interface UniverseHandoverConsent {
  documentId: string;
  version: string;
  effectiveAt: string;
  consentedAt: string;
  content: string;
}

/** 인수받을 수 있는 공식 계정. */
export interface UniverseHandoverAssignee {
  userId: string;
  nickname: string | null;
  creatorId: string;
}

export const UNIVERSE_HANDOVER_STATUS_LABEL: Record<
  UniverseHandoverStatus,
  string
> = {
  PENDING: "심사 대기",
  APPROVED: "인수",
  REJECTED: "반려",
  EXPIRED: "기한 만료",
};

export const UNIVERSE_HANDOVER_REASON_LABEL: Record<
  UniverseHandoverReason,
  string
> = {
  REAL_PERSON: "실존 인물",
  ORIGINAL_IP: "원작 IP·팬 캐릭터",
  STOLEN_IMAGE: "도용 이미지",
  PERSONAL_INFO: "개인정보 포함",
  REPORT_HISTORY: "신고 이력",
  OTHER: "기타",
  EXPIRED: "기한 만료",
};

export const HANDOVER_AGE_BASIS_LABEL: Record<HandoverAgeBasis, string> = {
  BIRTH: "생일로 성년 확인",
  SELF_ATTESTED: "성년 본인 진술",
};

/** 반려 사유 중 메모가 있어야 하는 것. 서버 `requiresNote()`와 같다. */
export const isHandoverNoteRequired = (
  reason: UniverseHandoverRejectReason | null,
) => reason === "OTHER";

/** 메모 최대 길이. 서버 `UniverseHandoverEntity.MAX_NOTE_LENGTH`와 같다. */
export const HANDOVER_NOTE_MAX_LENGTH = 1000;
