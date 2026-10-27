"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentOrderDetail } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  PAYMENT_ANOMALY_MEMO_MAX_LENGTH,
  PAYMENT_PG_PROVIDER_LABEL,
} from "@/constants/billingOptions";

interface ManualCancelModalProps {
  /** null이면 닫힌 상태다. */
  order: PaymentOrderDetail | null;
  onClose: () => void;
  onSubmit: (input: { pgCancelNo: string; memo: string }) => void;
  isSubmitting: boolean;
}

/**
 * PG 직접 취소 기록.
 *
 * **여기서 PG를 부르지 않는다.** 운영자가 PG 관리자 화면에서 이미 취소한 것을 우리 쪽에
 * 옮겨 적는 일이다. 적지 않으면 PG는 취소됐는데 우리는 계속 "환불 실패"나 "결제 완료"로
 * 남아, 다음 정산 대사에서 같은 건이 또 불일치로 올라온다.
 *
 * 취소번호를 필수로 받는 이유 — 나중에 PG 정산 파일과 맞춰 볼 유일한 근거다.
 */
const ManualCancelModal = ({
  order,
  onClose,
  onSubmit,
  isSubmitting,
}: ManualCancelModalProps) => {
  const targetKey = order?.paymentOrderId ?? "";
  const [draft, setDraft] = useState<{
    key: string;
    pgCancelNo: string;
    memo: string;
  } | null>(null);
  const current =
    draft?.key === targetKey ? draft : { key: targetKey, pgCancelNo: "", memo: "" };
  const update = (patch: Partial<typeof current>) =>
    setDraft({ ...current, ...patch });
  const canSubmit = current.pgCancelNo.trim().length > 0;

  const cancelAmount =
    order?.refunds.find((refund) => refund.status === "FAILED")?.refundAmount ??
    order?.amount ??
    0;

  return (
    <Modal
      isOpen={order !== null}
      onClose={onClose}
      title="PG 직접 취소 기록"
      description="PG 관리자 화면에서 이미 취소한 결제를 여기에 기록합니다. PG를 다시 부르지 않습니다."
      closeOnOverlayClick={false}
      isDirty={draft !== null}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onSubmit({
                pgCancelNo: current.pgCancelNo.trim(),
                memo: current.memo.trim(),
              })
            }
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            기록
          </Button>
        </>
      }
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="rounded-field border border-border-main bg-subtle p-3">
            <p className="body-6 text-font-2">
              {PAYMENT_PG_PROVIDER_LABEL[order.pgProvider]} · 거래번호{" "}
              <span className="font-mono">{order.pgTransactionId ?? "-"}</span>
            </p>
            <p className="mt-1 body-5 text-font-1">
              취소 금액 <b className="tabular-nums">{formatCurrency(cancelAmount)}</b>
            </p>
          </div>

          <Alert tone="warning">
            PG 관리자 화면에서 취소가 <b>끝난 뒤</b> 기록해 주세요. 기록하면 이 결제는
            환불 완료(또는 취소)로 바뀝니다.
          </Alert>

          <FormField
            label="PG 취소번호"
            htmlFor="manual-cancel-no"
            required
            error={canSubmit ? undefined : "PG 관리자 화면의 취소번호를 입력해 주세요."}
          >
            <Input
              id="manual-cancel-no"
              value={current.pgCancelNo}
              onChange={(event) => update({ pgCancelNo: event.target.value })}
              placeholder="예: C20260921000123"
            />
          </FormField>

          <FormField label="메모" htmlFor="manual-cancel-memo">
            <Textarea
              id="manual-cancel-memo"
              rows={2}
              maxLength={PAYMENT_ANOMALY_MEMO_MAX_LENGTH}
              value={current.memo}
              onChange={(event) => update({ memo: event.target.value })}
              placeholder="예: 정산 완료 건이라 PG 고객센터 통해 취소"
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

export default ManualCancelModal;
