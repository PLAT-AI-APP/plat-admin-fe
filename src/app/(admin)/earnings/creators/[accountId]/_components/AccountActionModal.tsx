"use client";

import { useState } from "react";
import { createIdempotencyKey } from "@/lib/idempotency";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
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
  GRANT: {
    title: "포인트 지급",
    description: "교환 가능 포인트로 바로 들어갑니다.",
    confirm: "지급",
  },
  DEDUCT: {
    title: "포인트 차감",
    description: "교환 가능 포인트 안에서 차감합니다.",
    confirm: "차감",
  },
};

/**
 * 조치마다 가장 흔한 사유. 한 사유로 고정해 두면 지급을 열어도 '부정 사용 의심'이
 * 골라져 있어, 그대로 누르면 이력에 엉뚱한 사유가 남는다.
 */
const DEFAULT_REASON: Record<AccountAction, EarningReasonCode> = {
  FREEZE: "FRAUD_SUSPECTED",
  UNFREEZE: "OPERATION_FIX",
  GRANT: "OPERATION_FIX",
  DEDUCT: "OPERATION_FIX",
};

export interface AccountActionInput {
  reasonCode: EarningReasonCode;
  memo: string;
  amount: number;
  /** 지급 · 차감에만 실린다. 모달을 연 순간 하나 만들어 끝까지 쥔다. */
  idempotencyKey: string;
}

interface AccountActionModalProps {
  action: AccountAction | null;
  available: number;
  isSubmitting: boolean;
  onClose: () => void;
  /** 서버 응답까지 기다린다. 실패하면 모달은 입력을 그대로 들고 남는다. */
  onSubmit: (input: AccountActionInput) => Promise<unknown>;
}

/** 한 번에 지급할 수 있는 최대 포인트. 서버와 같은 값이다. */
const MAX_GRANT = 10_000_000;

/**
 * 제작자 계정 조치. 모든 조치는 사유 코드와 메모가 필수다.
 *
 * 부모가 `key={action}`으로 조치마다 새로 만든다. 그래서 입력 · 사유 기본값 · 멱등키가
 * 열 때마다 새로 잡힌다. 한 번 연 모달 안에서는 멱등키가 그대로라, 응답이 늦어
 * 다시 눌러도 같은 지급으로 처리된다.
 */
const AccountActionModal = ({
  action,
  available,
  isSubmitting,
  onClose,
  onSubmit,
}: AccountActionModalProps) => {
  const [reasonCode, setReasonCode] = useState<EarningReasonCode>(
    action ? DEFAULT_REASON[action] : "OPERATION_FIX",
  );
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [idempotencyKey] = useState(() => createIdempotencyKey("earning"));

  if (!action) return null;
  const copy = ACTION_COPY[action];
  const amountValue = Number(amount) || 0;
  const withAmount = action === "GRANT" || action === "DEDUCT";
  const maxAmount = action === "GRANT" ? MAX_GRANT : available;
  const isInvalid =
    memo.trim().length === 0 ||
    (withAmount && (!Number.isInteger(amountValue) || amountValue <= 0 || amountValue > maxAmount));

  const handleSubmit = () => {
    const input: AccountActionInput = {
      reasonCode,
      memo: memo.trim(),
      amount: amountValue,
      idempotencyKey,
    };

    if (!withAmount) {
      /* 실패 안내는 뮤테이션이 띄운다. 여기서는 모달을 열어 둔 채 끝낸다. */
      onSubmit(input).catch(() => undefined);
      return;
    }

    /*
      포인트는 곧바로 움직이고 되돌리려면 반대 조치를 한 번 더 해야 한다.
      자릿수를 잘못 친 채 누르지 않도록 금액을 다시 읽게 한다.
    */
    openConfirm({
      title: `${formatWithCommas(amountValue)}P를 ${action === "GRANT" ? "지급" : "차감"}할까요?`,
      description:
        action === "GRANT"
          ? `교환 가능 포인트가 ${formatWithCommas(available)}P → ${formatWithCommas(available + amountValue)}P가 됩니다.`
          : `교환 가능 포인트가 ${formatWithCommas(available)}P → ${formatWithCommas(available - amountValue)}P가 됩니다.`,
      warning: "실행 즉시 반영되고 이력에 남습니다. 되돌리려면 반대 조치를 따로 해야 합니다.",
      confirmText: copy.confirm,
      tone: action === "GRANT" ? "default" : "danger",
      onConfirm: () => onSubmit(input),
    });
  };

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
            variant={action === "UNFREEZE" || action === "GRANT" ? "primary" : "danger"}
            disabled={isInvalid || isSubmitting}
            onClick={handleSubmit}
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {withAmount && (
          <FormField
            label={action === "GRANT" ? "지급 포인트" : "차감 포인트"}
            required
            hint={
              action === "GRANT"
                ? `한 번에 ${formatWithCommas(MAX_GRANT)}P까지`
                : `교환 가능 ${formatWithCommas(available)}P까지`
            }
          >
            <Input
              type="number"
              min={1}
              max={maxAmount}
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
