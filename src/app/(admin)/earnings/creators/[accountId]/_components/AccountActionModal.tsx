"use client";

import { useState } from "react";
import { formatWithCommas } from "@/lib/utils";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  EARNING_REASON_OPTIONS,
  type EarningReasonCode,
} from "@/type/earning";
import type { EarningAccountAction } from "@/api/earning/mutateEarning";

export type AccountAction = EarningAccountAction;

const ACTION_COPY: Record<AccountAction, { title: string; description: string; confirm: string }> = {
  FREEZE: {
    title: "계정 동결",
    description: "상품권 교환과 노트 전환이 멈춥니다. 적립은 계속 쌓입니다.",
    confirm: "동결",
  },
  UNFREEZE: {
    title: "동결 해제",
    description: "상품권 교환과 노트 전환이 다시 됩니다.",
    confirm: "해제",
  },
  DEDUCT: {
    title: "포인트 차감",
    description: "교환 가능 포인트 안에서 차감합니다.",
    confirm: "차감",
  },
};

export interface AccountActionInput {
  reasonCode: EarningReasonCode;
  memo: string;
  amount: number;
}

interface AccountActionModalProps {
  action: AccountAction | null;
  available: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: AccountActionInput) => void;
}

/** 제작자 계정 조치. 모든 조치는 사유 코드와 메모가 필수다. */
const AccountActionModal = ({
  action,
  available,
  isSubmitting,
  onClose,
  onSubmit,
}: AccountActionModalProps) => {
  const [reasonCode, setReasonCode] = useState<EarningReasonCode>("FRAUD_SUSPECTED");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");

  if (!action) return null;
  const copy = ACTION_COPY[action];
  const amountValue = Number(amount) || 0;
  const isInvalid =
    memo.trim().length === 0 ||
    (action === "DEDUCT" && (amountValue <= 0 || amountValue > available));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      size="sm"
      isDirty={memo.length > 0}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            variant={action === "UNFREEZE" ? "primary" : "danger"}
            disabled={isInvalid || isSubmitting}
            onClick={() =>
              onSubmit({ reasonCode, memo: memo.trim(), amount: amountValue })
            }
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {action === "DEDUCT" && (
          <FormField label="차감 포인트" required hint={`교환 가능 ${formatWithCommas(available)}P까지`}>
            <Input
              type="number"
              min={1}
              max={available}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </FormField>
        )}

        <FormField label="사유" required>
          <Select
            options={EARNING_REASON_OPTIONS}
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value as EarningReasonCode)}
          />
        </FormField>

        <FormField label="메모" required hint="조치 이력에 그대로 남습니다. 근거가 된 주문 번호 등을 적어 주세요.">
          <Textarea rows={3} maxLength={500} value={memo} onChange={(event) => setMemo(event.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
};

export default AccountActionModal;
