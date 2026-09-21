"use client";

import { useState } from "react";
import type { PaymentAnomaly, PaymentAnomalyType } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import {
  PAYMENT_ANOMALY_LABEL,
  PAYMENT_ANOMALY_MEMO_MAX_LENGTH,
} from "@/constants/billingOptions";

/**
 * - `CLEAR`: PG 대사 불일치처럼 확인해 보니 고칠 게 없는 건을 닫는다. 정상 경로다.
 * - `EXCEPTION`: 조치가 있는 유형을 조치 없이 닫는다. 이미 다른 길로 해결한 예외(수동 지급 등)에만 쓴다.
 */
export type AnomalyCloseMode = "CLEAR" | "EXCEPTION";

/** 예외로 닫으면 무엇이 고쳐지지 않은 채 남는지. 운영자가 누르기 전에 읽어야 한다. */
const EXCEPTION_WARNING: Record<PaymentAnomalyType, string> = {
  NOT_GRANTED: "유저는 결제했지만 노트를 받지 못한 상태 그대로입니다.",
  IN_DOUBT: "승인 여부를 모르는 상태 그대로입니다. 유저 카드에 청구됐을 수 있습니다.",
  PG_MISMATCH: "우리 기록과 PG가 다른 상태 그대로입니다.",
  REFUND_STUCK: "환불 PG 결과가 확정되지 않은 상태 그대로입니다.",
  REFUND_FAILED: "유저는 돈을 돌려받지 못했고 노트도 빠진 상태 그대로입니다.",
};

/** 기록에 예외 처리임이 드러나게 붙인다. 나중에 누가 조치 없이 닫았는지 추적하는 표식이다. */
export const EXCEPTION_MEMO_PREFIX = "[예외 처리] ";

interface AnomalyResolveModalProps {
  /** null이면 닫힌 상태다. */
  anomaly: PaymentAnomaly | null;
  mode: AnomalyCloseMode;
  onClose: () => void;
  onSubmit: (memo: string) => void;
  isSubmitting: boolean;
}

/**
 * 문제 없음으로 닫을 때 자주 쓰는 문구. 예외로 닫을 때는 일부러 주지 않는다 — 예외는 매번 사정이 달라
 * 직접 적어야 하고, 한 번 눌러 채워지면 휴먼 에러가 그대로 통과한다.
 */
const CLEAR_MEMO_PRESETS = ["PG 관리자 화면에서 확인한 결과 이상이 없습니다."];

/**
 * 이상을 조치 없이 닫는다.
 *
 * **이상을 고치는 버튼이 아니다.** 돈 · 노트는 그대로이고 '확인 필요'에서 빼기만 한다. 조치가 있는 유형은
 * 조치가 성공하면 저절로 닫히므로 여기 올 일이 없고, 오는 것은 예외뿐이다.
 * 메모를 비울 수 없는 이유 — 같은 유저가 다시 문의하면 이 한 줄이 근거다.
 */
const AnomalyResolveModal = ({
  anomaly,
  mode,
  onClose,
  onSubmit,
  isSubmitting,
}: AnomalyResolveModalProps) => {
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(
    null,
  );
  const targetKey = anomaly?.anomalyId ?? "";
  const memo = draft?.key === targetKey ? draft.value : "";
  const setMemo = (value: string) => setDraft({ key: targetKey, value });
  const canSubmit = memo.trim().length > 0;
  const isException = mode === "EXCEPTION";
  const label = anomaly ? PAYMENT_ANOMALY_LABEL[anomaly.type] : "";
  const submit = () => onSubmit(`${isException ? EXCEPTION_MEMO_PREFIX : ""}${memo.trim()}`);

  return (
    <Modal
      isOpen={anomaly !== null}
      onClose={onClose}
      title={isException ? `예외로 닫기 · ${label}` : `문제 없음으로 닫기 · ${label}`}
      description={
        isException
          ? "조치 없이 '확인 필요'에서 뺍니다. 이미 다른 방법으로 해결한 경우에만 쓰세요."
          : "확인해 보니 고칠 것이 없는 건을 닫습니다. 기록은 지우지 않고 메모와 함께 남습니다."
      }
      closeOnOverlayClick={false}
      isDirty={memo.length > 0}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant={isException ? "danger" : "primary"}
            onClick={submit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            {isException ? "예외로 닫기" : "문제 없음으로 닫기"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {anomaly && isException && (
          <Alert tone="danger" title="이 결제는 아직 고쳐지지 않았습니다.">
            {EXCEPTION_WARNING[anomaly.type]} 닫으면 목록에서만 사라지고, 기록에 &lsquo;예외 처리&rsquo;로 남습니다.
          </Alert>
        )}

        {anomaly && (
          <div className="rounded-field border border-border-main bg-subtle p-3">
            <p className="body-6 text-font-2">서버 판정</p>
            <p className="mt-1 body-5 text-font-1">{anomaly.detail}</p>
          </div>
        )}

        <FormField
          label={isException ? "예외 사유" : "처리 메모"}
          htmlFor="payment-anomaly-memo"
          required
          error={
            canSubmit
              ? undefined
              : isException
                ? "어떤 방법으로 이미 해결했는지 직접 적어 주세요."
                : "무엇을 확인했는지 적어 주세요."
          }
        >
          <div className="flex flex-col gap-2">
            {!isException && (
            <div className="flex flex-wrap gap-1.5">
              {CLEAR_MEMO_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMemo(preset)}
                  className="rounded-full border border-border-main px-2.5 py-1 text-left body-6 break-keep text-font-2 transition hover:border-brand hover:text-brand"
                >
                  {preset}
                </button>
              ))}
            </div>
            )}
            <Textarea
              id="payment-anomaly-memo"
              rows={3}
              maxLength={PAYMENT_ANOMALY_MEMO_MAX_LENGTH}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder={
                isException
                  ? "예: 크레딧 수동 조정으로 1,000노트 지급 완료 (CS 티켓 #2481)"
                  : "예: 이미 반영된 건의 PG 재전송 통지"
              }
            />
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default AnomalyResolveModal;
