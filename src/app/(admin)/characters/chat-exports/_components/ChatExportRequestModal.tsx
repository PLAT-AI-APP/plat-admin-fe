"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCharacterListQuery } from "@/api/character/getCharacterList";
import dayjs, { toDateInputValue } from "@/lib/dayjs";
import {
  chatExportSchema,
  type ChatExportSchema,
} from "@/schema/chatExport.schema";
import type { SelectOption } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";

interface ChatExportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ChatExportSchema) => void;
  isSubmitting: boolean;
}

/** 대상 선택 목록은 한 번에 받아 온다. 캐릭터 수가 많아지면 검색형 피커로 교체한다. */
const CHARACTER_OPTION_SIZE = 100;

/** 기본 추출 기간 (오늘 기준 최근 7일) */
const DEFAULT_PERIOD_DAYS = 7;

const EMPTY_VALUES: ChatExportSchema = {
  targetType: "CHARACTER",
  targetId: 0,
  startDate: "",
  endDate: "",
};

const ChatExportRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ChatExportRequestModalProps) => {
  const { data, isLoading } = useCharacterListQuery({
    page: 1,
    size: CHARACTER_OPTION_SIZE,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatExportSchema>({
    resolver: zodResolver(chatExportSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 기본 기간(최근 7일)으로 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...EMPTY_VALUES,
      startDate: toDateInputValue(
        dayjs().subtract(DEFAULT_PERIOD_DAYS, "day").toDate(),
      ),
      endDate: toDateInputValue(new Date()),
    });
  }, [isOpen, reset]);

  const characterOptions: SelectOption[] = (data?.content ?? []).map(
    (character) => ({
      label: `${character.name} (#${character.characterId})`,
      value: String(character.characterId),
    }),
  );

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="채팅 내보내기 요청"
      description="선택한 캐릭터의 기간 내 대화 기록을 파일로 추출합니다."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            요청
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="대상 캐릭터"
          htmlFor="chat-export-target"
          required
          error={errors.targetId?.message}
          hint={isLoading ? "목록을 불러오는 중" : undefined}
        >
          <Controller
            control={control}
            name="targetId"
            render={({ field }) => (
              <Select
                id="chat-export-target"
                options={characterOptions}
                placeholder="대상 캐릭터를 선택하세요"
                disabled={isLoading}
                hasError={Boolean(errors.targetId)}
                value={field.value ? String(field.value) : ""}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </FormField>

        <div className="grid grid-cols-2 items-start gap-4">
          <FormField
            label="시작일"
            htmlFor="chat-export-start-date"
            required
            error={errors.startDate?.message}
          >
            <Input
              id="chat-export-start-date"
              type="date"
              hasError={Boolean(errors.startDate)}
              {...register("startDate")}
            />
          </FormField>

          <FormField
            label="종료일"
            htmlFor="chat-export-end-date"
            required
            error={errors.endDate?.message}
          >
            <Input
              id="chat-export-end-date"
              type="date"
              hasError={Boolean(errors.endDate)}
              {...register("endDate")}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default ChatExportRequestModal;
