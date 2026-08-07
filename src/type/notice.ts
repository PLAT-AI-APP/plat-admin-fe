/**
 * 공지사항.
 *
 * 법적 고지와 동일하게 **마크다운 본문**으로 관리한다.
 * 다만 법적 고지가 "타입별 활성 문서 1건"인 것과 달리, 공지는 여러 건이 동시에
 * 게시되고 노출 기간과 상단 고정 여부로 정렬된다.
 */

export type NoticeCategory =
  | "SERVICE"
  | "UPDATE"
  | "EVENT"
  | "MAINTENANCE"
  | "POLICY";

export const NOTICE_CATEGORY_LABEL: Record<NoticeCategory, string> = {
  SERVICE: "서비스",
  UPDATE: "업데이트",
  EVENT: "이벤트",
  MAINTENANCE: "점검",
  POLICY: "정책",
};

export type NoticeStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = {
  DRAFT: "임시 저장",
  PUBLISHED: "게시 중",
  HIDDEN: "숨김",
};

export interface Notice {
  noticeId: number;
  category: NoticeCategory;
  title: string;
  /** 마크다운 본문 */
  content: string;
  status: NoticeStatus;
  /** 목록 최상단 고정 여부 */
  isPinned: boolean;
  /** 노출 시작·종료. 비어 있으면 기간 제한이 없다. */
  startAt?: string;
  endAt?: string;
  viewCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeFormValues {
  category: NoticeCategory;
  title: string;
  content: string;
  status: NoticeStatus;
  isPinned: boolean;
  startAt?: string;
  endAt?: string;
}
