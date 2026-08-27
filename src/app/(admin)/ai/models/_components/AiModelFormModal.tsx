"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aiModelSchema, type AiModelSchema } from "@/schema/aiModel.schema";
import type { AiModel } from "@/type/ai";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Textarea from "@/components/ui/Textarea";
import { AI_PROVIDER_LABEL, AI_PROVIDER_TONE } from "../../_constants/aiOptions";

interface AiModelFormModalProps {
  /** 수정 대상. null이면 모달을 닫는다. */
  model: AiModel | null;
  onClose: () => void;
  onSubmit: (values: AiModelSchema) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: AiModelSchema = {
  creditCost: 0,
  maxOutputTokens: 1_024,
  temperature: 0.7,
  memo: "",
  isEnabled: true,
};

const AiModelFormModal = ({
  model,
  onClose,
  onSubmit,
  isSubmitting,
}: AiModelFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AiModelSchema>({
    resolver: zodResolver(aiModelSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 모델의 현재 설정으로 폼을 초기화한다.
  useEffect(() => {
    if (!model) return;

    reset({
      creditCost: model.creditCost,
      maxOutputTokens: model.maxOutputTokens,
      temperature: model.temperature,
      memo: model.memo,
      isEnabled: model.isEnabled,
    });
  }, [model, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={model !== null}
      onClose={onClose}
      title="모델 설정 수정"
      description="모델명·제공사는 카탈로그가 소유하므로 여기서 바꿀 수 없습니다."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            isLoading={isSubmitting}
            disabled={!isDirty}
          >
            저장
          </Button>
        </>
      }
    >
      {model && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-field border border-border-main bg-subtle px-4 py-3">
            <div className="min-w-0">
              <p className="body-4 font-medium text-font-1">
                {model.displayName}
              </p>
              <p className="mt-0.5 body-6 text-font-2">{model.model}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {model.isDefault && <Badge tone="brand">기본 모델</Badge>}
              <Badge tone={AI_PROVIDER_TONE[model.provider]}>
                {AI_PROVIDER_LABEL[model.provider]}
              </Badge>
            </div>
          </div>

          <Controller
            control={control}
            name="isEnabled"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-field border border-border-main px-4 py-3">
                <div className="min-w-0">
                  <p className="body-5 font-medium text-font-1">
                    사용 여부
                  </p>
                  <p className="mt-0.5 body-6 text-font-2">
                    {model.isDefault
                      ? "기본 모델은 사용 중지할 수 없습니다. 먼저 다른 모델을 기본으로 지정하세요."
                      : "사용 중지하면 신규 대화에서 이 모델이 선택되지 않습니다."}
                  </p>
                </div>

                <Switch
                  label="사용 여부"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={model.isDefault}
                />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="차감 크레딧"
              htmlFor="ai-model-credit-cost"
              required
              error={errors.creditCost?.message}
              hint="응답 1회당"
            >
              <Input
                id="ai-model-credit-cost"
                type="number"
                min={0}
                max={999}
                hasError={Boolean(errors.creditCost)}
                {...register("creditCost", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="최대 출력 토큰"
              htmlFor="ai-model-max-output-tokens"
              required
              error={errors.maxOutputTokens?.message}
              hint="256 ~ 64,000"
            >
              <Input
                id="ai-model-max-output-tokens"
                type="number"
                min={256}
                max={64_000}
                step={256}
                hasError={Boolean(errors.maxOutputTokens)}
                {...register("maxOutputTokens", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            label="temperature"
            htmlFor="ai-model-temperature"
            required
            error={errors.temperature?.message}
            hint="0 ~ 2 · 높을수록 답변이 다양해집니다."
          >
            <Input
              id="ai-model-temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              hasError={Boolean(errors.temperature)}
              {...register("temperature", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="메모"
            htmlFor="ai-model-memo"
            error={errors.memo?.message}
            hint="100자 이내"
          >
            <Textarea
              id="ai-model-memo"
              rows={3}
              placeholder="운영자끼리 공유할 메모를 남겨 주세요."
              hasError={Boolean(errors.memo)}
              {...register("memo")}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
};

export default AiModelFormModal;
