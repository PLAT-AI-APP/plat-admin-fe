"use client";

import { useState } from "react";
import { cn, formatCredit, formatCurrency } from "@/lib/utils";
import type { AdminRefundReasonCode, PaymentOrderDetail } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  ADMIN_REFUND_REASON_LABEL,
  PAYMENT_PG_PROVIDER_LABEL,
  REFUND_REJECT_REASON_MAX_LENGTH,
} from "@/constants/billingOptions";

/** 내부 사유 최대 길이. 서버 `admin_memo VARCHAR(500)`에 맞춘다. */
const ADMIN_MEMO_MAX_LENGTH = 500;

interface ForceRefundModalProps {
  /** null이면 닫힌 상태다. */
  order: PaymentOrderDetail | null;
  onClose: () => void;
  onSubmit: (input: {
    reasonCode: AdminRefundReasonCode;
    reason: string;
    adminMemo: string;
  }) => void;
  isSubmitting: boolean;
}

const REASON_CODES = Object.keys(ADMIN_REFUND_REASON_LABEL) as AdminRefundReasonCode[];

/**
 * 강제 환불.
 *
 * 규칙(사용 여부 · 기한)상 막히는 건도 운영 판단으로 돌려줄 때 쓴다. 막지 않는 대신 **누르기 전에 손실을 보게 한다** —
 * 결제 금액 전액이 나가고, 이 결제로 준 노트는 남은 만큼만 회수되어 이미 쓴 몫은 회사 손실로 남는다.
 * 손실이 있으면 확인 체크를 해야 버튼이 켜진다. 유저에게 보일 문구와 운영자끼리 보는 내부 사유를 따로 받는다.
 */
const ForceRefundModal = ({ order, onClose, onSubmit, isSubmitting }: ForceRefundModalProps) => {
  const targetKey = order?.paymentOrderId ?? "";
  const [draft, setDraft] = useState<{
    key: string;
    reasonCode: AdminRefundReasonCode;
    reason: string;
    adminMemo: string;
    acknowledged: boolean;
  } | null>(null);

  const current =
    draft?.key === targetKey
      ? draft
      : {
          key: targetKey,
          reasonCode: "ADMIN" as AdminRefundReasonCode,
          reason: "",
          adminMemo: "",
          acknowledged: false,
        };
  const update = (patch: Partial<typeof current>) => setDraft({ ...current, ...patch });

  /* 원장 줄을 더하면 이 결제로 받은 노트 중 지금 남은 양이다. 채팅이 잡고 있으면 서버가 그만큼 덜 회수한다. */
  const remaining = order
    ? Math.max(0, order.creditEntries.reduce((sum, entry) => sum + entry.creditDelta, 0))
    : 0;
  const lost = order ? order.creditAmount - remaining : 0;
  const hasLoss = lost > 0;

  const canSubmit =
    current.reason.trim().length > 0 &&
    current.adminMemo.trim().length > 0 &&
    (!hasLoss || current.acknowledged);

  return (
    <Modal
      isOpen={order !== null}
      onClose={onClose}
      title="강제 환불"
      description="사용 여부 · 기한을 보지 않고 결제 금액 전액을 돌려줍니다. 되돌릴 수 없습니다."
      closeOnOverlayClick={false}
      isDirty={draft !== null}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              onSubmit({
                reasonCode: current.reasonCode,
                reason: current.reason.trim(),
                adminMemo: current.adminMemo.trim(),
              })
            }
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            강제 환불
          </Button>
        </>
      }
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-field border border-border-main bg-subtle p-3">
              <p className="body-6 text-font-2">
                {PAYMENT_PG_PROVIDER_LABEL[order.pgProvider]}로 취소
              </p>
              <p className="mt-1 body-4 font-semibold text-font-1 tabular-nums">
                {formatCurrency(order.paidAmount)}
              </p>
            </div>
            <div className="rounded-field border border-border-main bg-subtle p-3">
              <p className="body-6 text-font-2">회수할 노트</p>
              <p className="mt-1 body-4 font-semibold text-font-1 tabular-nums">
                {formatCredit(remaining)}
              </p>
            </div>
            <div
              className={cn(
                "rounded-field border p-3",
                hasLoss ? "border-danger/30 bg-danger-bg" : "border-border-main bg-subtle",
              )}
            >
              <p className={cn("body-6", hasLoss ? "text-danger" : "text-font-2")}>손실 (이미 씀)</p>
              <p
                className={cn(
                  "mt-1 body-4 font-semibold tabular-nums",
                  hasLoss ? "text-danger" : "text-font-1",
                )}
              >
                {formatCredit(lost)}
              </p>
            </div>
          </div>

          <Alert tone="warning">
            채팅이 노트를 예약하고 있으면 그만큼은 회수하지 않아 손실이 더 커질 수 있습니다. 환불에 강제 표시가 남고
            업무 Slack으로 알림이 갑니다.
          </Alert>

          <FormField label="경위" required>
            <div className="flex flex-wrap gap-1.5">
              {REASON_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={current.reasonCode === code}
                  onClick={() => update({ reasonCode: code })}
                  className={cn(
                    "rounded-full border px-3 py-1 body-6 transition",
                    current.reasonCode === code
                      ? "border-brand bg-brand-opacity text-brand"
                      : "border-border-main text-font-2 hover:border-brand hover:text-brand",
                  )}
                >
                  {ADMIN_REFUND_REASON_LABEL[code]}
                </button>
              ))}
            </div>
          </FormField>

          <FormField
            label="환불 사유 (유저에게 보입니다)"
            htmlFor="force-refund-reason"
            required
          >
            <Textarea
              id="force-refund-reason"
              rows={2}
              maxLength={REFUND_REJECT_REASON_MAX_LENGTH}
              value={current.reason}
              onChange={(event) => update({ reason: event.target.value })}
              placeholder="예: 고객센터 요청으로 환불해 드렸습니다."
            />
          </FormField>

          <FormField
            label="내부 사유 (운영자만 봅니다)"
            htmlFor="force-refund-memo"
            required
          >
            <Textarea
              id="force-refund-memo"
              rows={2}
              maxLength={ADMIN_MEMO_MAX_LENGTH}
              value={current.adminMemo}
              onChange={(event) => update({ adminMemo: event.target.value })}
              placeholder="예: CS 티켓 #2481 · 반복 민원, 팀장 승인"
            />
          </FormField>

          {hasLoss && (
            <Checkbox
              checked={current.acknowledged}
              onChange={(event) => update({ acknowledged: event.target.checked })}
              label={`이미 쓴 ${formatCredit(lost)}는 회수하지 못하고 손실로 남는 것을 확인했습니다.`}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ForceRefundModal;
