"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PasswordInput from "@/components/ui/PasswordInput";
import Textarea from "@/components/ui/Textarea";
import type { SecretItem } from "@/type/secret";
import { getServiceLabel } from "../../server/_constants/serverStatus";

export interface SecretSaveInput {
  secretValue: string | null;
  expiresOn: string | null;
  memo: string | null;
}

interface SecretSaveModalProps {
  target: SecretItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: SecretSaveInput) => void;
}

/**
 * 값은 입력칸에서만 보인다(눈 버튼으로 확인). 비워 두면 만료일 · 메모만 바뀐다. 값을 바꿀 때는 무엇이 일어나는지 확인을 한 번 더
 * 받는다 — 잘못된 값이 들어가면 재시작 뒤 서버가 뜨지 않거나 결제 · 로그인이 멈춘다. 잠긴 시크릿은 값 칸이 없다.
 */
const SecretSaveModal = ({
  target,
  isSubmitting,
  onClose,
  onSubmit,
}: SecretSaveModalProps) => {
  const [secretValue, setSecretValue] = useState("");
  const [expiresOn, setExpiresOn] = useState(target?.expiresOn ?? "");
  const [memo, setMemo] = useState(target?.memo ?? "");
  const [acknowledged, setAcknowledged] = useState(false);

  if (!target) return null;
  const isLocked = target.lockedReason !== null;
  const isChangingValue = secretValue.length > 0;
  const hasEdgeSpace =
    isChangingValue &&
    (secretValue !== secretValue.trim() || /[\r\n]/.test(secretValue));
  const restartLabel = target.restartApps.map(getServiceLabel).join(" · ");
  const canSubmit =
    !isSubmitting && !hasEdgeSpace && (!isChangingValue || acknowledged);

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
            variant={isChangingValue ? "danger" : "primary"}
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                secretValue: isChangingValue ? secretValue : null,
                expiresOn: expiresOn || null,
                memo: memo.trim() || null,
              })
            }
          >
            {isChangingValue ? "새 값 저장" : "저장"}
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
          <>
            <FormField
              label="새 값"
              hint={
                hasEdgeSpace
                  ? "앞뒤에 공백이나 줄바꿈이 있습니다."
                  : "비워 두면 값은 그대로 둡니다."
              }
            >
              <PasswordInput
                autoComplete="off"
                spellCheck={false}
                value={secretValue}
                onChange={(event) => {
                  setSecretValue(event.target.value);
                  setAcknowledged(false);
                }}
                placeholder={
                  target.registered ? "새 값으로 덮어씁니다" : "값을 넣습니다"
                }
              />
            </FormField>

            {target.note && <Alert tone="info">{target.note}</Alert>}

            {isChangingValue && !hasEdgeSpace && (
              <Alert tone="warning" title="저장해도 바로 바뀌지 않습니다.">
                <div className="flex flex-col gap-2">
                  <span>
                    {restartLabel}를 재시작하면 새 값을 씁니다. 값이 틀리면
                    재시작 뒤 그 기능이 멈추니, 그때는 되돌리기를 누르고 다시
                    재시작하세요.
                  </span>
                  <Checkbox
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    label="확인했습니다"
                  />
                </div>
              </Alert>
            )}
          </>
        )}

        <FormField
          label="만료일"
          hint="적어 두면 7일 전부터 Slack 으로 알립니다."
        >
          <Input
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
          />
        </FormField>

        <FormField label="메모" hint="발급처 등. 값은 적지 마세요.">
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
