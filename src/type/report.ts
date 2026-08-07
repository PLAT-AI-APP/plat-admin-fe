/**
 * 신고.
 *
 * 캐릭터만 신고 대상이던 구조를 댓글·유저까지 받도록 일반화했다.
 * 댓글과 마찬가지로 `targetType` + `targetId`로 대상을 가리키는 다형 구조라,
 * 새로운 신고 대상이 생기면 `ReportTargetType`에 값만 추가하면 된다.
 */

export type ReportTargetType = "CHARACTER" | "COMMENT" | "USER";

export const REPORT_TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  CHARACTER: "캐릭터",
  COMMENT: "댓글",
  USER: "유저",
};

export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "접수",
  REVIEWING: "검토 중",
  RESOLVED: "처리 완료",
  REJECTED: "반려",
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
  SPAM: "스팸",
  ETC: "기타",
};

export interface Report {
  reportId: number;
  targetType: ReportTargetType;
  targetId: number;
  /** 대상 이름. 목록에서 무엇이 신고됐는지 바로 알 수 있게 서버가 채워준다. */
  targetName: string;
  /** 신고된 내용 일부. 댓글이면 본문, 캐릭터면 설명 일부다. */
  targetSnippet?: string;
  reporterId: number;
  reporterNickname: string;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  /** 같은 대상에 누적된 신고 수. 높을수록 먼저 확인해야 한다. */
  targetReportCount: number;
  handlerName?: string;
  handlerNote?: string;
  handledAt?: string;
  createdAt: string;
}

export interface UpdateReportStatusValues {
  status: ReportStatus;
  handlerNote?: string;
}

/** 신고 대상 화면으로 이동할 경로를 만든다. 대상 타입이 늘면 여기만 고친다. */
export const getReportTargetHref = (report: Report): string => {
  const routeByType: Record<ReportTargetType, string> = {
    CHARACTER: "/characters",
    COMMENT: "/community/comments",
    USER: "/users",
  };

  return `${routeByType[report.targetType]}?keyword=${encodeURIComponent(report.targetName)}`;
};
