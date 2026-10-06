"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  HANDOVER_NOTE_MAX_LENGTH,
  isHandoverNoteRequired,
  type UniverseHandover,
  type UniverseHandoverRejectReason,
} from "@/type/universeHandover";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { HANDOVER_REJECT_OPTIONS } from "../_constants/handoverOptions";

interface HandoverRejectModalProps {
  handover: UniverseHandover;
  onClose: () => void;
  onSubmit: (values: { reason: UniverseHandoverRejectReason; note: string }) => void;
  isSubmitting: boolean;
}

/** 인수 반려. 세계관이 삭제되며 되돌릴 수 없다. 기타는 메모가 필수다. */
const HandoverRejectModal = ({
  handover,
  onClose,
  onSubmit,
  isSubmitting,
}: HandoverRejectModalProps) => {
  const [reason, setReason] = useState<UniverseHandoverRejectReason | null>(null);
  const [note, setNote] = useState("");

  const isNoteRequired = isHandoverNoteRequired(reason);
  const canSubmit = reason !== null && (!isNoteRequired || note.trim().length > 0);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="인수 반려"
      description={`#${handover.handoverId} · ${handover.universeTitle ?? "제목 없음"}. 반려하면 세계관이 삭제됩니다. 되돌릴 수 없습니다.`}
      closeOnOverlayClick={false}
      isDirty={Boolean(reason || note)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="danger"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            onClick={() => reason && onSubmit({ reason, note })}
          >
            반려
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="반려 사유" required>
          <div role="radiogroup" aria-label="반려 사유" className="grid grid-cols-2 gap-2">
            {HANDOVER_REJECT_OPTIONS.map((option) => {
              const isSelected = reason === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setReason(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-field border p-3 text-left transition",
                    isSelected
                      ? "border-brand bg-brand-opacity"
                      : "border-border-main hover:border-brand hover:bg-surface-hover",
                  )}
                >
                  <span
                    className={cn(
                      "body-4 font-semibold",
                      isSelected ? "text-brand" : "text-font-1",
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="body-6 text-font-2">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField
          label="메모"
          htmlFor="handover-reject-note"
          required={isNoteRequired}
          hint={`운영 내부 기록 (${note.length}/${HANDOVER_NOTE_MAX_LENGTH})`}
        >
          <Textarea
            id="handover-reject-note"
            rows={3}
            maxLength={HANDOVER_NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isNoteRequired ? "반려 사유를 적어 주세요." : undefined}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default HandoverRejectModal;
