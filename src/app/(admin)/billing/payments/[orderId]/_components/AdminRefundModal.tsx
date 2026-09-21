"use client";

import { useState } from "react";
import { cn, formatCredit, formatCurrency } from "@/lib/utils";
import type { AdminRefundReasonCode, PaymentOrderDetail } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  ADMIN_REFUND_REASON_LABEL,
  PAYMENT_PG_PROVIDER_LABEL,
  REFUND_REJECT_REASON_MAX_LENGTH,
} from "@/constants/billingOptions";

interface AdminRefundModalProps {
  /** null이면 닫힌 상태다. */
  order: PaymentOrderDetail | null;
  onClose: () => void;
  onSubmit: (input: { reasonCode: AdminRefundReasonCode; reason: string }) => void;
  isSubmitting: boolean;
}

const REASON_CODES = Object.keys(ADMIN_REFUND_REASON_LABEL) as AdminRefundReasonCode[];

/**
 * 관리자 환불.
 *
 * 유저 요청을 승인하는 것과 달리 **이 버튼이 곧 승인이다.** 누르면 PG로 돈이 나가고
 * 노트 전액이 회수된다. 그래서 얼마가 어디로 나가는지와 유저에게 보일 사유를 한 화면에서
 * 확인하고 누르게 한다.
 */
const AdminRefundModal = ({
  order,
  onClose,
  onSubmit,
  isSubmitting,
}: AdminRefundModalProps) => {
  const targetKey = order?.paymentOrderId ?? "";
  const [draft, setDraft] = useState<{
    key: string;
    reasonCode: AdminRefundReasonCode;
    reason: string;
  } | null>(null);

  const current =
    draft?.key === targetKey
      ? draft
      : {
          key: targetKey,
          reasonCode: "ADMIN" as AdminRefundReasonCode,
          reason: "",
        };
  const update = (patch: Partial<typeof current>) =>
    setDraft({ ...current, ...patch });
  const canSubmit = current.reason.trim().length > 0;

  return (
    <Modal
      isOpen={order !== null}
      onClose={onClose}
      title="관리자 환불"
      description="승인 단계 없이 바로 PG 취소까지 진행합니다. 되돌릴 수 없습니다."
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
              onSubmit({ reasonCode: current.reasonCode, reason: current.reason.trim() })
            }
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            환불
          </Button>
        </>
      }
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="rounded-field border border-border-main bg-subtle p-3">
            <p className="body-6 text-font-2">
              {order.userNickname ?? `탈퇴 회원 #${order.userId}`} · {order.orderUid}
            </p>
            <p className="mt-1 body-5 text-font-1">
              {PAYMENT_PG_PROVIDER_LABEL[order.pgProvider]}로{" "}
              <b className="tabular-nums">{formatCurrency(order.paidAmount)}</b> 취소 ·
              노트 <b className="tabular-nums">{formatCredit(order.creditAmount)}</b> 회수
            </p>
          </div>

          {/*
            노트는 전액만 회수된다(서버에 부분 회수가 없다). 이 결제의 노트를 한 개라도 썼으면
            서버가 거절한다 — 그때는 확인 처리로 닫고 PG에서 직접 정리한다.
          */}
          <Alert tone="warning">
            유저가 이 결제의 노트를 한 개라도 썼다면 서버가 “크레딧 사용”으로 환불을 거절합니다.
            결제 후 7일 기한은 보지 않습니다.
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
            htmlFor="admin-refund-reason"
            required
            error={canSubmit ? undefined : "사유를 입력해 주세요."}
          >
            <Textarea
              id="admin-refund-reason"
              rows={3}
              maxLength={REFUND_REJECT_REASON_MAX_LENGTH}
              value={current.reason}
              onChange={(event) => update({ reason: event.target.value })}
              placeholder="예: 고객센터 요청으로 환불해 드렸습니다."
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

export default AdminRefundModal;
