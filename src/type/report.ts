import type { PermissionKey } from "./permission";
import type { UniverseVisibility } from "./character";
import type { UserStatus } from "./user";

/**
 * 신고.
 *
 * 신고 한 건을 따로 처리하지 않고 **대상 단위의 케이스로 묶어** 한 번에 판정한다.
 * 댓글 하나가 열 명에게 신고되면 케이스 하나에 신고 열 건이다. 판정 · 조치 · 처리자는
 * 케이스에 붙는다. 계약의 원본은 plat-be `docs/19-Report-Guide.md`다.
 *
 * 새 대상 타입이 생기면 이 파일의 타입 · 라벨 · 허용 조치 · `getReportTargetHref`,
 * 상세 화면의 스냅샷 렌더러 레지스트리를 함께 고친다(docs/19 체크리스트).
 */

export type ReportTargetType = "COMMENT" | "UNIVERSE";

export const REPORT_TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  COMMENT: "댓글",
  UNIVERSE: "세계관",
};

export type ReportReason =
  | "SEXUAL"
  | "VIOLENCE"
  | "HATE"
  | "COPYRIGHT"
  | "SPAM"
  | "ETC";

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SEXUAL: "선정성",
  VIOLENCE: "폭력성",
  HATE: "혐오 표현",
  COPYRIGHT: "저작권",
  SPAM: "스팸·광고",
  ETC: "기타",
};

/** 케이스 상태. 닫힌 케이스는 다시 열리지 않는다 — 재신고는 새 케이스가 된다. */
export type ReportCaseStatus = "PENDING" | "ACTIONED" | "DISMISSED";

export const REPORT_CASE_STATUS_LABEL: Record<ReportCaseStatus, string> = {
  PENDING: "처리 대기",
  ACTIONED: "조치 완료",
  DISMISSED: "위반 없음",
};

/** 판정. 케이스를 닫는 두 갈래다. */
export type ReportOutcome = Exclude<ReportCaseStatus, "PENDING">;

export const REPORT_OUTCOME_LABEL: Record<ReportOutcome, string> = {
  ACTIONED: "조치함",
  DISMISSED: "위반 없음",
};

/** 대상에 거는 조치. 피신고자 제재는 대상과 무관해 따로 둔다(`ReportSanction`). */
export type ReportAction = "HIDE_COMMENT" | "UNIVERSE_DELETE";

export const REPORT_ACTION_LABEL: Record<ReportAction, string> = {
  HIDE_COMMENT: "댓글 숨김",
  UNIVERSE_DELETE: "세계관 삭제",
};

/** 대상별로 허용된 조치. 맞지 않는 조치를 보내면 서버가 400으로 거절한다. */
export const REPORT_ACTIONS_BY_TARGET: Record<ReportTargetType, ReportAction[]> = {
  COMMENT: ["HIDE_COMMENT"],
  UNIVERSE: ["UNIVERSE_DELETE"],
};

/**
 * 조치마다 추가로 필요한 권한. 처리 자체(`report:write`)와 별개다.
 * 신고 담당 권한만으로 댓글 숨김 · 세계관 제재 · 유저 정지를 우회하지 못하게 한다.
 */
export const REPORT_ACTION_PERMISSION: Record<ReportAction, PermissionKey> = {
  HIDE_COMMENT: "comment:write",
  UNIVERSE_DELETE: "universe:write",
};

/** 피신고자 제재에 필요한 권한 */
export const REPORT_SANCTION_PERMISSION: PermissionKey = "user:write";

export type ReportCaseSort = "REPORT_COUNT_DESC" | "LAST_REPORTED_DESC";

/**
 * 대상의 현재 상태.
 * 댓글은 `VISIBLE | HIDDEN | DELETED`, 세계관은 `ACTIVE | INACTIVE | DELETED | PURGED`다.
 */
export type ReportTargetStatus =
  | "VISIBLE"
  | "HIDDEN"
  | "DELETED"
  | "ACTIVE"
  | "INACTIVE"
  | "PURGED";

export const REPORT_TARGET_STATUS_LABEL: Record<ReportTargetStatus, string> = {
  VISIBLE: "노출 중",
  HIDDEN: "숨김",
  DELETED: "삭제됨",
  ACTIVE: "활성",
  INACTIVE: "비활성",
  PURGED: "파기됨",
};

/** 신고자 · 피신고자 요약. 탈퇴 등으로 닉네임이 없을 수 있다. */
export interface ReportUserRef {
  /** Snowflake. 문자열 그대로 다룬다. */
  userId: string;
  nickname: string | null;
}

/** 댓글 스냅샷. 신고자가 그 순간 본 내용이다. */
export interface CommentReportSnapshot {
  type: "COMMENT";
  authorUserId: string;
  authorNickname: string;
  content: string;
  parentCommentId: string | null;
  universeId: string;
  universeTitle: string;
  writtenAt: string;
}

export interface UniverseReportSnapshotCharacter {
  name: string;
  description: string;
  profileImageUrl: string | null;
}

/** 세계관 스냅샷. 번역 필드는 원문 언어 기준이다. */
export interface UniverseReportSnapshot {
  type: "UNIVERSE";
  creatorUserId: string;
  creatorNickname: string;
  title: string;
  introduce: string;
  description: string;
  profileImageUrl: string | null;
  characters: UniverseReportSnapshotCharacter[];
}

/** 대상 타입별 스냅샷. `type`으로 갈라 렌더러를 고른다. */
export type ReportSnapshot = CommentReportSnapshot | UniverseReportSnapshot;

export type ReportSnapshotOf<T extends ReportTargetType> = Extract<
  ReportSnapshot,
  { type: T }
>;

/** 케이스 목록 한 줄 */
export interface ReportCaseItem {
  caseId: string;
  targetType: ReportTargetType;
  targetId: string;
  /** 가장 최근 신고의 스냅샷에서 갱신된 목록 표시용 값 */
  targetTitle: string | null;
  targetExcerpt: string | null;
  /** 피신고자. 스냅샷 시점에 확정된다. */
  owner: ReportUserRef;
  status: ReportCaseStatus;
  reportCount: number;
  topReason: ReportReason;
  firstReportedAt: string;
  lastReportedAt: string;
  handledAt: string | null;
  handlerName: string | null;
}

export interface ReportTargetState {
  /** 작성자 삭제 · 파기로 대상이 사라졌으면 false. 이때 대상 조치는 건너뛴다. */
  exists: boolean;
  status: ReportTargetStatus | null;
  /** 세계관만 값이 있다. */
  visibility: UniverseVisibility | null;
}

export type ReportSanctionStatus = "SUSPENDED" | "BANNED";

export interface ReportSanction {
  status: ReportSanctionStatus;
  /** 기간 정지일 때만 있다. 영구 정지(`BANNED`)는 없다. */
  suspendedUntil: string | null;
}

export interface ReportResolution {
  outcome: ReportOutcome;
  actions: ReportAction[];
  ownerSanction: ReportSanction | null;
  /** 운영 내부 기록. 신고자에게 노출되지 않는다. */
  note: string;
  handlerId: number | null;
  handlerName: string | null;
  handledAt: string;
}

/** 같은 대상의 지난 케이스 */
export interface ReportPreviousCase {
  caseId: string;
  status: ReportCaseStatus;
  reportCount: number;
  handledAt: string | null;
}

export interface ReportCaseDetail extends ReportCaseItem {
  /** 최신 신고의 스냅샷 */
  snapshot: ReportSnapshot | null;
  targetState: ReportTargetState;
  ownerStatus: UserStatus | null;
  reasonCounts: Partial<Record<ReportReason, number>>;
  /** 처리 후에만 있다. */
  resolution: ReportResolution | null;
  previousCases: ReportPreviousCase[];
}

/** 개별 신고 한 건 */
export interface ReportEntryItem {
  reportId: string;
  caseId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string | null;
  reporter: ReportUserRef;
  reason: ReportReason;
  detail: string | null;
  /** 그 신고 시점의 스냅샷 */
  snapshot: ReportSnapshot | null;
  createdAt: string;
  caseStatus: ReportCaseStatus;
}

/** 처리 요청 */
export interface ResolveReportValues {
  outcome: ReportOutcome;
  actions: ReportAction[];
  ownerSanction: ReportSanction | null;
  note: string;
}

/**
 * 신고 대상의 원본 화면 경로. 대상 타입이 늘면 여기만 고친다.
 *
 * 댓글은 상세 페이지가 없어 댓글 관리에서 상세 모달이 열리도록 ID를 실어 보낸다.
 */
export const getReportTargetHref = (
  targetType: ReportTargetType,
  targetId: string,
): string => {
  const hrefByType: Record<ReportTargetType, string> = {
    COMMENT: `/community/comments?commentId=${targetId}`,
    UNIVERSE: `/universes/${targetId}`,
  };

  return hrefByType[targetType];
};

/** 닉네임이 없는 유저(탈퇴 등)는 ID로 보여 준다. */
export const formatReportUser = (user: ReportUserRef): string =>
  user.nickname ?? `탈퇴 회원 #${user.userId}`;
