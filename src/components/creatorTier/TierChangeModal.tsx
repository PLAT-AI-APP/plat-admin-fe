"use client";

import { useState } from "react";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type {
  CreatorTierChangeInput,
  CreatorTierCode,
} from "@/type/creatorTier";
import { TIER_NAME, TIER_ORDER } from "./tierMeta";

interface TierChangeModalProps {
  nickname: string;
  current: CreatorTierCode;
  locked: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  /** 서버 응답까지 기다린다. 실패하면 모달은 입력을 그대로 들고 남는다. */
  onSubmit: (input: CreatorTierChangeInput) => Promise<unknown>;
}

const OPTIONS = TIER_ORDER.map((value) => ({ label: TIER_NAME[value], value }));

/**
 * 예외 조정. 제재로 내리거나, 오리진으로 지정하거나, 승급 신청을 막는다(고정).
 * 부모가 열 때마다 새로 만든다.
 */
const TierChangeModal = ({
  nickname,
  current,
  locked: initialLocked,
  isSubmitting,
  onClose,
  onSubmit,
}: TierChangeModalProps) => {
  const [tier, setTier] = useState<CreatorTierCode>(current);
  const [locked, setLocked] = useState(initialLocked);
  const [memo, setMemo] = useState("");

  const isDown = TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(current);
  const changed = tier !== current || locked !== initialLocked;

  const handleSubmit = () =>
    openConfirm({
      title:
        tier === current
          ? `${nickname}의 등급 고정을 바꿀까요?`
          : `${nickname}을(를) ${TIER_NAME[tier]}(으)로 바꿀까요?`,
      description: `${TIER_NAME[current]} → ${TIER_NAME[tier]}`,
      warning: isDown
        ? "등급을 내리면 받던 혜택도 함께 줄어듭니다."
        : undefined,
      confirmText: "변경",
      tone: isDown ? "danger" : "default",
      onConfirm: () =>
        onSubmit({ tier, locked, memo: memo.trim() }).then(() => undefined),
    });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="등급 변경"
      description={`${nickname} · 현재 ${TIER_NAME[current]}`}
      size="sm"
      isDirty={changed || memo.length > 0}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            variant={isDown ? "danger" : "primary"}
            disabled={!changed || memo.trim().length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            변경
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="등급" required>
          <Select
            options={OPTIONS}
            value={tier}
            onChange={(event) => setTier(event.target.value as CreatorTierCode)}
          />
        </FormField>

        {tier === "ORIGIN" && current !== "ORIGIN" && (
          <Alert tone="info">
            오리진은 독점 계약 제작자에게만 지정합니다. 제작자는 다음 접속 때
            오리진 승급 화면을 봅니다.
          </Alert>
        )}
        {isDown && (
          <Alert tone="warning">
            등급을 내립니다. 이미 받은 승급 축하 노트는 회수하지 않습니다.
          </Alert>
        )}

        <Checkbox
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
          label="등급 고정 · 제작자가 승급을 신청하지 못하게 합니다"
        />

        <FormField label="사유" required hint="등급 이력에 그대로 남습니다.">
          <Textarea
            rows={3}
            maxLength={500}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default TierChangeModal;
