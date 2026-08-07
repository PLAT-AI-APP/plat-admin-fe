"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ProactiveMessageFormValues } from "@/api/communication/mutateProactiveMessage";
import {
  proactiveMessageSchema,
  type ProactiveMessageSchema,
} from "@/schema/proactiveMessage.schema";
import type { ProactiveMessage } from "@/type/communication";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { PROACTIVE_TRIGGER_OPTIONS } from "../../_constants/labels";

interface ProactiveMessageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  message?: ProactiveMessage;
  onSubmit: (values: ProactiveMessageFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: ProactiveMessageSchema = {
  trigger: "NO_CHAT_3DAYS",
  characterId: "",
  content: "",
  isEnabled: true,
};

const ProactiveMessageFormModal = ({
  isOpen,
  onClose,
  message,
  onSubmit,
  isSubmitting,
}: ProactiveMessageFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProactiveMessageSchema>({
    resolver: zodResolver(proactiveMessageSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 메시지 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      message
        ? {
            trigger: message.trigger,
            characterId: message.characterId
              ? String(message.characterId)
              : "",
            content: message.content,
            isEnabled: message.isEnabled,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, message, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      trigger: values.trigger,
      // 비워두면 전체 캐릭터 공통 메시지가 된다.
      characterId: values.characterId ? Number(values.characterId) : undefined,
      content: values.content,
      isEnabled: values.isEnabled,
    });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={message ? "선제 메시지 수정" : "선제 메시지 등록"}
      description="지정한 조건이 충족되면 캐릭터가 먼저 말을 겁니다."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {message ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="트리거"
          htmlFor="proactive-trigger"
          required
          error={errors.trigger?.message}
          hint="메시지를 보낼 조건입니다."
        >
          <Select
            id="proactive-trigger"
            options={PROACTIVE_TRIGGER_OPTIONS}
            hasError={Boolean(errors.trigger)}
            {...register("trigger")}
          />
        </FormField>

        <FormField
          label="대상 캐릭터 ID"
          htmlFor="proactive-character-id"
          error={errors.characterId?.message}
          hint="비워두면 전체 캐릭터에 적용됩니다."
        >
          <Input
            id="proactive-character-id"
            inputMode="numeric"
            placeholder="예: 3"
            hasError={Boolean(errors.characterId)}
            {...register("characterId")}
          />
        </FormField>

        <FormField
          label="메시지 내용"
          htmlFor="proactive-content"
          required
          error={errors.content?.message}
          hint="캐릭터 말투로 작성해 주세요."
        >
          <Textarea
            id="proactive-content"
            rows={4}
            placeholder="요즘 통 소식이 없네요. 오늘 하루는 어땠어요?"
            hasError={Boolean(errors.content)}
            {...register("content")}
          />
        </FormField>

        <Controller
          control={control}
          name="isEnabled"
          render={({ field }) => (
            <Checkbox
              label="등록 즉시 사용"
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          )}
        />
      </form>
    </Modal>
  );
};

export default ProactiveMessageFormModal;
