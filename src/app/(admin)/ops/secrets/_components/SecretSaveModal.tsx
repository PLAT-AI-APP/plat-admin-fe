"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import type { SecretItem } from "@/type/secret";

interface SecretSaveModalProps {
  target: SecretItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    secretValue: string | null;
    expiresOn: string | null;
    memo: string | null;
  }) => void;
}

/** 값은 입력칸에서만 잠깐 보인다. 비워 두면 만료일 · 메모만 바뀐다. 잠긴 시크릿은 값 칸이 없다. */
const SecretSaveModal = ({
  target,
  isSubmitting,
  onClose,
  onSubmit,
}: SecretSaveModalProps) => {
  const [secretValue, setSecretValue] = useState("");
  const [expiresOn, setExpiresOn] = useState(target?.expiresOn ?? "");
  const [memo, setMemo] = useState(target?.memo ?? "");

  if (!target) return null;
  const isLocked = target.lockedReason !== null;
  const hasEdgeSpace =
    secretValue.length > 0 &&
    (secretValue !== secretValue.trim() || /[\r\n]/.test(secretValue));
  const isChangingValue = secretValue.length > 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${target.label} ${isLocked ? "정보 수정" : "변경"}`}
      description={target.name}
      size="sm"
      isDirty={isChangingValue}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={hasEdgeSpace || isSubmitting}
            onClick={() =>
              onSubmit({
                secretValue: isChangingValue ? secretValue : null,
                expiresOn: expiresOn || null,
                memo: memo.trim() || null,
              })
            }
          >
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {isLocked ? (
          <Alert tone="warning" title="화면에서 값을 바꿀 수 없습니다">
            {target.lockedReason} 바꿔야 하면 AWS 콘솔에서 바꿉니다.
          </Alert>
        ) : (
          <FormField
            label="새 값"
            hint={
              hasEdgeSpace
                ? "앞뒤에 공백이나 줄바꿈이 있습니다."
                : `비워 두면 값은 그대로 두고 만료일 · 메모만 바꿉니다. 저장 뒤 ${target.restartApps.join(" · ")} 를 다시 띄워야 반영됩니다.`
            }
          >
            <Input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={secretValue}
              onChange={(event) => setSecretValue(event.target.value)}
              placeholder={target.registered ? "새 값으로 덮어씁니다" : "값"}
            />
          </FormField>
        )}

        {!isLocked && target.note && <Alert tone="info">{target.note}</Alert>}

        <FormField
          label="만료일"
          hint="적어 두면 7일 전부터 Slack 으로 알립니다. 없으면 비워 두세요."
        >
          <Input
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
          />
        </FormField>

        <FormField label="메모" hint="어디서 발급했는지 등. 값은 적지 마세요.">
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

export default SecretSaveModal;
