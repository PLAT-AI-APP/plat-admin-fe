"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  AI_KEY_PROVIDER_LABEL,
  AI_KEY_SLOT_LABEL,
  type AiKeyProvider,
  type AiKeySlot,
} from "@/type/aiKey";

export interface AiKeySaveTarget {
  provider: AiKeyProvider;
  slot: AiKeySlot;
  /** 이미 저장된 키가 있으면 교체다. */
  isReplace: boolean;
  expiresOn: string | null;
}

interface AiKeySaveModalProps {
  target: AiKeySaveTarget | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { apiKey: string; expiresOn: string | null }) => void;
}

/** 키는 입력칸에서만 잠깐 보이고 저장 뒤에는 끝 4자리만 남는다. */
const AiKeySaveModal = ({
  target,
  isSubmitting,
  onClose,
  onSubmit,
}: AiKeySaveModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [expiresOn, setExpiresOn] = useState(target?.expiresOn ?? "");

  if (!target) return null;
  const trimmed = apiKey.trim();
  const hasInnerSpace = /\s/.test(trimmed);
  const isInvalid = trimmed.length < 20 || hasInnerSpace;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${AI_KEY_PROVIDER_LABEL[target.provider]} ${AI_KEY_SLOT_LABEL[target.slot]} 키 ${target.isReplace ? "교체" : "등록"}`}
      description="저장하면 몇 초 안에 모든 AI 서버가 새 키를 씁니다. 저장 뒤 연결 확인을 함께 돌립니다."
      size="sm"
      isDirty={apiKey.length > 0}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={isInvalid || isSubmitting}
            onClick={() =>
              onSubmit({ apiKey: trimmed, expiresOn: expiresOn || null })
            }
          >
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField
          label="API 키"
          required
          hint={
            hasInnerSpace
              ? "키 가운데에 공백이나 줄바꿈이 있습니다."
              : "제공사 콘솔에서 발급한 키를 붙여 넣으세요."
          }
        >
          <Input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
          />
        </FormField>

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
      </div>
    </Modal>
  );
};

export default AiKeySaveModal;
