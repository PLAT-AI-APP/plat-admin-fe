import type { Comment } from "@/type/comment";

interface CommentHiddenReasonProps {
  comment: Comment;
}

/**
 * 왜 내려갔는지 한 줄.
 *
 * 상위 댓글 조치에 딸려 내려간 답글에는 사유가 없다. 루트의 사유를 복사하면
 * 아무 문제 없는 답글에 "욕설" 같은 사유가 붙어, 목록에서 **그 답글이 그래서
 * 내려간 것처럼** 읽히기 때문이다. 그런 답글은 사유 대신 딸려 내려갔다는 사실을 적는다.
 *
 * 사유는 자르지 않는다. 운영자가 조치 근거를 읽으려고 보는 문장이라
 * 뒤가 잘리면 목록에서 판단할 수 없고, 상세를 다시 열어야 한다.
 */
const CommentHiddenReason = ({ comment }: CommentHiddenReasonProps) => {
  if (comment.status !== "HIDDEN") return null;

  if (comment.cascaded) {
    return (
      <p className="mt-1 body-6 break-words whitespace-pre-line text-font-disabled">
        상위 댓글 조치로 함께 숨김
      </p>
    );
  }

  if (!comment.hiddenReason) return null;

  return (
    <p className="mt-1 body-6 break-words whitespace-pre-line text-warning">
      사유: {comment.hiddenReason}
    </p>
  );
};

export default CommentHiddenReason;
