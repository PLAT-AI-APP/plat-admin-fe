/**
 * 공지사항.
 *
 * 법적 고지와 동일하게 **마크다운 본문**으로 관리한다.
 * 다만 법적 고지가 "타입별 활성 문서 1건"인 것과 달리, 공지는 여러 건이 동시에
 * 게시되고 상단 고정 여부로 정렬된다.
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

/** 공지 목록 한 행. 목록 API에는 마크다운 본문과 수정자 ID가 오지 않는다. */
export interface NoticeSummary {
  /** 서버에서는 Snowflake ID가 문자열로 오고, API 레이어에서 숫자로 바꾼다. */
  noticeId: number;
  category: NoticeCategory;
  title: string;
  status: NoticeStatus;
  /** 목록 최상단 고정 여부 */
  isPinned: boolean;
  viewCount: number;
  /**
   * 등록한 관리자 이름 **스냅샷**.
   *
   * 계정을 참조하지 않고 그 시점의 이름을 통째로 복사해 둔다. 계정이 삭제된 뒤에도
   * 누가 올린 공지인지는 남아야 하기 때문이다.
   *
   * 이 값은 **콘솔 전용**이다. 앱에 내려가는 공지 응답에는 담지 않으며,
   * 유저에게는 언제나 '운영자'가 등록한 것으로 보인다.
   */
  createdBy: string;
  /** 등록 관리자 계정 ID. 계정이 삭제되면 비고 이름만 남는다. */
  createdById?: number;
  /** 마지막으로 수정한 관리자. 등록 이후 손댄 적이 없으면 비어 있다. */
  updatedBy?: string;
  /**
   * 최종 수정 관리자 계정 ID.
   *
   * **목록 응답에는 아직 담기지 않는다**(상세 응답에만 있다). 그동안 화면은
   * 이름만 적는다 — `formatAdmin`이 ID 없는 경우를 그대로 처리한다.
   * 서버가 목록에도 실어 주면 여기 값이 채워지고 화면은 손댈 것이 없다.
   */
  updatedById?: number;
  createdAt: string;
  updatedAt?: string;
}

/** 공지 상세. 수정 폼과 상세 모달은 이 응답으로 본문까지 조회한다. */
export interface NoticeDetail extends NoticeSummary {
  /** 마크다운 본문 */
  content: string;
}

export interface NoticeFormValues {
  category: NoticeCategory;
  title: string;
  content: string;
  status: NoticeStatus;
  isPinned: boolean;
}
