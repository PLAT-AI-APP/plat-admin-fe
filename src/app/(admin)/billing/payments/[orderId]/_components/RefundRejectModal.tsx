"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { RefundListItem } from "@/type/billing";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  REFUND_REJECT_REASON_MAX_LENGTH,
  REFUND_REJECT_REASON_PRESETS,
} from "@/constants/billingOptions";

interface RefundRejectModalProps {
  /** null이면 모달이 닫힌 상태다. 결제 상세도 같은 모달을 쓰므로 필요한 값만 받는다. */
  refund: Pick<
    RefundListItem,
    "refundId" | "userNickname" | "orderUid" | "productName" | "refundAmount"
  > | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

/**
 * 환불 거절 사유 입력.
 *
 * **사유는 유저에게 그대로 보인다.** 유저는 돈을 돌려받지 못한 이유를 이 문장으로만 안다.
 * 그래서 비워 둘 수 없고, 자주 쓰는 사유는 완성된 문장으로 제공한다.
 *
 * 노트를 써서 거절해야 하는 건은 여기서 거절하지 않아도 된다. 승인하면 서버가
 * 정해진 문구로 자동 거절한다.
 */
const RefundRejectModal = ({
  refund,
  onClose,
  onSubmit,
  isSubmitting,
}: RefundRejectModalProps) => {
  /* 다른 건을 열면 이전 입력이 남지 않도록 대상이 바뀌면 초안을 버린다. */
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(
    null,
  );
  const targetKey = refund?.refundId ?? "";
  const reason = draft?.key === targetKey ? draft.value : "";

  const setReason = (value: string) => setDraft({ key: targetKey, value });

  const canSubmit = reason.trim().length > 0;

  return (
    <Modal
      isOpen={refund !== null}
      onClose={onClose}
      title="환불 거절"
      description="거절하면 돈과 노트는 그대로 두고 요청만 닫습니다. 사유는 유저에게 그대로 보이고 기록으로 남습니다."
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
            거절
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {refund && (
          <div className="rounded-field border border-border-main bg-subtle p-3">
            <p className="body-6 text-font-2">
              {refund.userNickname} · {refund.orderUid}
            </p>
            <p className="mt-1 body-5 text-font-1">
              {refund.productName} · {formatCurrency(refund.refundAmount)}
            </p>
          </div>
        )}

        <FormField
          label="거절 사유"
          htmlFor="refund-reject-reason"
          required
          error={canSubmit ? undefined : "사유를 입력해 주세요."}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {REFUND_REJECT_REASON_PRESETS.map((preset) => (
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

            {/* 서버 컬럼이 255자다. 넘겨 보내면 저장이 아니라 400으로 끝난다. */}
            <Textarea
              id="refund-reject-reason"
              rows={3}
              maxLength={REFUND_REJECT_REASON_MAX_LENGTH}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="유저에게 보일 거절 사유를 입력하거나 위에서 선택해 주세요."
            />
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default RefundRejectModal;
