/**
 * 댓글.
 *
 * 지금은 세계관·캐릭터에 달리지만 다른 영역에도 붙을 예정이다.
 * 그래서 특정 도메인에 종속시키지 않고 `targetType` + `targetId`로 대상을 가리키는
 * **다형(polymorphic) 구조**로 관리한다.
 * 새 영역에 댓글이 생기면 `CommentTargetType`에 값을 하나 추가하면 화면은 그대로 쓴다.
 *
 * 공지사항은 운영자가 일방적으로 알리는 글이라 댓글 기능 자체가 없다. 그래서 대상에 넣지 않는다.
 */

/**
 * 댓글이 달리는 대상.
 *
 * 서버 `CommentTargetType`과 값이 같아야 한다. `POST` · `CREATOR`는 서버 enum에는 있지만
 * 아직 댓글이 달리지 않는다. 그래도 타입에 두는 이유는, 서버가 그 값을 내려보내기 시작했을 때
 * 화면이 라벨 없는 빈 배지를 그리지 않게 하기 위해서다.
 */
export type CommentTargetType = "UNIVERSE" | "CHARACTER" | "POST" | "CREATOR";

export const COMMENT_TARGET_TYPE_LABEL: Record<CommentTargetType, string> = {
  UNIVERSE: "세계관",
  CHARACTER: "캐릭터",
  POST: "게시글",
  CREATOR: "제작자",
};

/**
 * 댓글 상태.
 * 삭제는 이력을 남겨야 하므로 물리 삭제 대신 상태로 관리한다.
 *
 * 행이 실제로 사라지는 경로는 셋뿐이다 — 대상이 통째로 파기될 때, 회원이 탈퇴할 때,
 * 그리고 `DELETED`로 **90일**이 지났을 때. 마지막 것이 보관 기한으로,
 * 신고와 분쟁을 처리할 창이 닫히면 서버 배치가 원문까지 지운다.
 */
export type CommentStatus = "VISIBLE" | "HIDDEN" | "DELETED";

export const COMMENT_STATUS_LABEL: Record<CommentStatus, string> = {
  VISIBLE: "노출",
  HIDDEN: "숨김",
  DELETED: "삭제됨",
};

/**
 * 목록 정렬. 서버 `CommentOrderBy` enum과 값이 같아야 한다.
 */
export type CommentSort = "CREATED_DESC" | "REPORT_DESC";

export interface Comment {
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  commentId: string;
  targetType: CommentTargetType;
  /** 대상은 유저·캐릭터·세계관 등이고 전부 Snowflake다. 문자열 그대로 다룬다. */
  targetId: string;
  /**
   * 대상 이름. 목록에서 어디에 달린 댓글인지 바로 알 수 있게 서버가 채워준다.
   * 이름을 둘 곳이 없는 대상이거나 번역이 하나도 없으면 비어 있고, 그때는 ID를 보여준다.
   */
  targetName: string | null;
  /** 대댓글이면 부모 댓글 ID */
  parentCommentId: string | null;
  content: string;
  authorId: string;
  authorNickname: string;
  status: CommentStatus;
  /**
   * 상위 댓글 조치에 딸려 상태가 바뀐 답글인가.
   *
   * 이 답글은 **직접 제재를 받은 것이 아니다.** 그래서 `hiddenReason`이 비어 있고,
   * 화면은 사유 대신 "상위 댓글 조치로 함께 숨김"으로 읽어야 한다.
   * 재노출도 루트를 되돌릴 때 이 표시가 붙은 답글만 함께 올라온다.
   */
  cascaded: boolean;
  /** 누적 신고 수. 높을수록 먼저 확인해야 한다. */
  reportCount: number;
  likeCount: number;
  /** 이 댓글에 달린 답글 수. 보이는 답글만 센다. */
  replyCount: number;
  /** 숨김 사유. **딸려 내려간 답글에는 비어 있다** — `cascaded`를 함께 읽어야 한다. */
  hiddenReason: string | null;
  handledBy: string | null;
  /** 처리 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  handledById: number | null;
  handledAt: string | null;
  createdAt: string;
}

/**
 * 대상의 **상세 화면**으로 바로 가는 경로를 만든다. 대상 타입이 늘면 여기만 고친다.
 *
 * 콘솔에 화면이 없는 대상은 `null`이다. 없는 경로로 링크를 걸면 눌렀을 때 404가 뜨는데,
 * 그건 데이터가 잘못된 것처럼 보여서 링크를 아예 걸지 않는 편이 낫다.
 */
export const getCommentTargetHref = (comment: Comment): string | null => {
  const hrefByType: Record<CommentTargetType, string | null> = {
    UNIVERSE: `/universes/${comment.targetId}`,
    CHARACTER: `/universes/characters/${comment.targetId}`,
    POST: null,
    CREATOR: null,
  };

  return hrefByType[comment.targetType];
};
