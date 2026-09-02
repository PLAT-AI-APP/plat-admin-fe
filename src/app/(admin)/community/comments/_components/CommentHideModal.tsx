"use client";

import { useState } from "react";
import { truncate } from "@/lib/utils";
import type { Comment } from "@/type/comment";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  COMMENT_HIDE_REASON_MAX_LENGTH,
  COMMENT_HIDE_REASONS,
} from "./commentOptions";

interface CommentHideModalProps {
  /** null이면 모달이 닫힌 상태다. 여러 건이면 일괄 처리다. */
  targets: Comment[] | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

/**
 * 댓글 숨김 사유 입력.
 *
 * 사유는 작성자에게 통보되고 기록으로 남으므로 반드시 받는다.
 * 자주 쓰는 사유는 버튼으로 제공하고, 필요하면 직접 수정할 수 있다.
 *
 * **프리셋은 자르지 않는다.** 고를 문장을 뒤가 잘린 채로 보여 주면 무엇을 고르는지
 * 알 수 없어, 눌러서 입력란을 확인한 뒤 다시 고르게 된다. 버튼이 두 줄로 늘어나는 편이 낫다.
 */
const CommentHideModal = ({
  targets,
  onClose,
  onSubmit,
  isSubmitting,
}: CommentHideModalProps) => {
  /**
   * 모달을 열 때마다 이전 입력이 남지 않아야 한다.
   * effect로 초기화하면 렌더가 한 번 더 도므로, 대상이 바뀌면 draft를 버리는 방식으로 처리한다.
   */
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(
    null,
  );
  const targetKey = (targets ?? []).map((item) => item.commentId).join(",");
  const reason = draft?.key === targetKey ? draft.value : "";

  const setReason = (value: string) => setDraft({ key: targetKey, value });

  const isBulk = (targets?.length ?? 0) > 1;
  const canSubmit = reason.trim().length > 0;

  return (
    <Modal
      isOpen={targets !== null}
      onClose={onClose}
      title={isBulk ? `댓글 ${targets?.length}건 숨김` : "댓글 숨김"}
      description="숨긴 댓글은 앱에서 보이지 않습니다. 사유는 작성자에게 통보되고 기록으로 남습니다. 루트 댓글이면 그 답글도 함께 내려갑니다."
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() => onSubmit(reason.trim())}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            숨김 처리
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!isBulk && targets?.[0] && (
          <div className="rounded-field border border-border-main bg-subtle p-3">
            <p className="body-6 text-font-2">
              {targets[0].authorNickname} · #{targets[0].commentId}
            </p>
            <p className="mt-1 body-5 text-font-1">
              {truncate(targets[0].content, 120)}
            </p>
          </div>
        )}

        <FormField
          label="숨김 사유"
          htmlFor="comment-hide-reason"
          required
          error={canSubmit ? undefined : "사유를 입력해 주세요."}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {COMMENT_HIDE_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="rounded-full border border-border-main px-2.5 py-1 text-left body-6 break-keep text-font-2 transition hover:border-brand hover:text-brand"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* 서버가 200자까지만 받는다. 넘겨 보내면 저장이 아니라 400으로 끝난다. */}
            <Textarea
              id="comment-hide-reason"
              rows={3}
              maxLength={COMMENT_HIDE_REASON_MAX_LENGTH}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="숨김 사유를 입력하거나 위에서 선택해 주세요."
            />
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default CommentHideModal;
