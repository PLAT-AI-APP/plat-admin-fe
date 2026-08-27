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

export type CommentTargetType = "UNIVERSE" | "CHARACTER";

export const COMMENT_TARGET_TYPE_LABEL: Record<CommentTargetType, string> = {
  UNIVERSE: "세계관",
  CHARACTER: "캐릭터",
};

/**
 * 댓글 상태.
 * 삭제는 이력을 남겨야 하므로 물리 삭제 대신 상태로 관리한다.
 */
export type CommentStatus = "VISIBLE" | "HIDDEN" | "DELETED";

export const COMMENT_STATUS_LABEL: Record<CommentStatus, string> = {
  VISIBLE: "노출",
  HIDDEN: "숨김",
  DELETED: "삭제됨",
};

export interface Comment {
  commentId: number;
  targetType: CommentTargetType;
  targetId: number;
  /** 대상 이름. 목록에서 어디에 달린 댓글인지 바로 알 수 있게 서버가 채워준다. */
  targetName: string;
  /** 대댓글이면 부모 댓글 ID */
  parentCommentId?: number;
  content: string;
  authorId: number;
  authorNickname: string;
  status: CommentStatus;
  /** 누적 신고 수. 높을수록 먼저 확인해야 한다. */
  reportCount: number;
  likeCount: number;
  /** 숨김 처리 사유와 처리자 */
  hiddenReason?: string;
  handledBy?: string;
  /** 처리 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  handledById?: number;
  handledAt?: string;
  createdAt: string;
}

/**
 * 대상의 **상세 화면**으로 바로 가는 경로를 만든다. 대상 타입이 늘면 여기만 고친다.
 */
export const getCommentTargetHref = (comment: Comment): string => {
  const hrefByType: Record<CommentTargetType, string> = {
    UNIVERSE: `/universes/${comment.targetId}`,
    CHARACTER: `/universes/characters/${comment.targetId}`,
  };

  return hrefByType[comment.targetType];
};
