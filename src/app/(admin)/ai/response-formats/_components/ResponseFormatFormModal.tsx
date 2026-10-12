"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { responseFormatSchema, type ResponseFormatSchema } from "@/schema/responseFormat.schema";
import type { ResponseFormat, ResponseFormatValues } from "@/type/chatBilling";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Textarea from "@/components/ui/Textarea";

interface ResponseFormatFormModalProps {
  isOpen: boolean;
  /** 수정 대상. 없으면 추가 모드다. */
  format: ResponseFormat | null;
  /** 추가할 때 채워 둘 노출 순서. 목록 맨 뒤에 붙도록 계산해 넘긴다. */
  defaultSortOrder: number;
  onClose: () => void;
  onSubmit: (values: ResponseFormatValues) => void;
  isSubmitting: boolean;
}

/** 빈 칸은 NaN 으로 들어오므로 분량을 말하지 않는 것(null)으로 바꾼다. */
const blankToNull = (value: unknown) =>
  value === "" || value === null || (typeof value === "number" && Number.isNaN(value)) ? null : Number(value);

const ResponseFormatFormModal = ({
  isOpen,
  format,
  defaultSortOrder,
  onClose,
  onSubmit,
  isSubmitting,
}: ResponseFormatFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ResponseFormatSchema>({ resolver: zodResolver(responseFormatSchema) });

  // 모달을 열 때마다 대상 형식(없으면 빈 값)으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      format
        ? {
            code: format.code,
            name: format.name,
            description: format.description,
            maxOutputTokens: format.maxOutputTokens,
            recentMessageCount: format.recentMessageCount,
            targetChars: format.targetChars,
            styleDirective: format.styleDirective,
            refInputTokens: format.refInputTokens,
            refOutputTokens: format.refOutputTokens,
            enabled: format.enabled,
            sortOrder: format.sortOrder,
          }
        : {
            code: "",
            name: "",
            description: "",
            maxOutputTokens: 1_000,
            recentMessageCount: 20,
            targetChars: null,
            styleDirective: "",
            refInputTokens: 20_000,
            refOutputTokens: 600,
            enabled: true,
            sortOrder: defaultSortOrder,
          },
    );
  }, [isOpen, format, defaultSortOrder, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      isDirty={isDirty}
      onClose={onClose}
      size="lg"
      title={format ? "응답 형식 수정" : "응답 형식 추가"}
      description="바꾼 값은 다음 대화부터 출력 상한·최근 대화 수·분량 지시에 적용됩니다. 코드는 추가한 뒤 바꿀 수 없습니다."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting} disabled={!isDirty}>
            저장
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="코드" htmlFor="response-format-code" required error={errors.code?.message} hint="예: CHAT">
            <Input
              id="response-format-code"
              disabled={format !== null}
              hasError={Boolean(errors.code)}
              {...register("code")}
            />
          </FormField>
          <FormField label="이름" htmlFor="response-format-name" required error={errors.name?.message} hint="20자 이내">
            <Input id="response-format-name" hasError={Boolean(errors.name)} {...register("name")} />
          </FormField>
        </div>

        <FormField
          label="설명"
          htmlFor="response-format-description"
          required
          error={errors.description?.message}
          hint="채팅방·시나리오 설정에 그대로 보입니다."
        >
          <Input id="response-format-description" hasError={Boolean(errors.description)} {...register("description")} />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="출력 상한 (토큰)"
            htmlFor="response-format-max-output"
            required
            error={errors.maxOutputTokens?.message}
            hint="생각 몫 제외"
          >
            <Input
              id="response-format-max-output"
              type="number"
              hasError={Boolean(errors.maxOutputTokens)}
              {...register("maxOutputTokens", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="최근 대화 수"
            htmlFor="response-format-recent"
            required
            error={errors.recentMessageCount?.message}
            hint="많을수록 비쌈"
          >
            <Input
              id="response-format-recent"
              type="number"
              hasError={Boolean(errors.recentMessageCount)}
              {...register("recentMessageCount", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="목표 분량 (자)"
            htmlFor="response-format-target"
            error={errors.targetChars?.message}
            hint="비우면 미지정"
          >
            <Input
              id="response-format-target"
              type="number"
              hasError={Boolean(errors.targetChars)}
              {...register("targetChars", { setValueAs: blankToNull })}
            />
          </FormField>
        </div>

        <FormField
          label="문체 지시"
          htmlFor="response-format-style"
          required
          error={errors.styleDirective?.message}
          hint="시스템 프롬프트의 응답 분량 구간에 그대로 들어갑니다."
        >
          <Textarea
            id="response-format-style"
            rows={4}
            hasError={Boolean(errors.styleDirective)}
            {...register("styleDirective")}
          />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="기준 입력 토큰"
            htmlFor="response-format-ref-input"
            required
            error={errors.refInputTokens?.message}
            hint="예상 노트용"
          >
            <Input
              id="response-format-ref-input"
              type="number"
              hasError={Boolean(errors.refInputTokens)}
              {...register("refInputTokens", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="기준 출력 토큰"
            htmlFor="response-format-ref-output"
            required
            error={errors.refOutputTokens?.message}
            hint="생각 포함"
          >
            <Input
              id="response-format-ref-output"
              type="number"
              hasError={Boolean(errors.refOutputTokens)}
              {...register("refOutputTokens", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="노출 순서" htmlFor="response-format-sort" required error={errors.sortOrder?.message}>
            <Input
              id="response-format-sort"
              type="number"
              hasError={Boolean(errors.sortOrder)}
              {...register("sortOrder", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-field border border-border-main px-4 py-3">
              <div className="min-w-0">
                <p className="body-5 font-medium text-font-1">사용 여부</p>
                <p className="mt-0.5 body-6 text-font-2">끄면 시나리오 설정에서 고를 수 없습니다.</p>
              </div>
              <Switch label="사용 여부" checked={field.value} onChange={field.onChange} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
};

export default ResponseFormatFormModal;
