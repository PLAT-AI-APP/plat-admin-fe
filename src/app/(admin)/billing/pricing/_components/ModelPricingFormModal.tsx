"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  aiModelPricingSchema,
  type AiModelPricingSchema,
} from "@/schema/aiModel.schema";
import type { AiModel } from "@/type/ai";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  AI_MODEL_ROLES,
  AI_MODEL_ROLE_LABEL,
  AI_MODEL_ROLE_TONE,
  AI_PROVIDER_LABEL,
  AI_PROVIDER_TONE,
} from "@/app/(admin)/ai/_constants/aiOptions";

interface ModelPricingFormModalProps {
  /** 수정 대상. null이면 모달을 닫는다. */
  model: AiModel | null;
  onClose: () => void;
  onSubmit: (values: AiModelPricingSchema) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: AiModelPricingSchema = {
  cacheRatioPercent: 75,
  priceMultiplier: "",
  inputPricePerMillion: 0,
  outputPricePerMillion: 0,
  cacheReadPricePerMillion: 0,
  cacheWritePricePerMillion: 0,
};

/** 단가 입력 칸. 모두 100만 토큰당 원이다. */
const PRICE_FIELDS = [
  { name: "inputPricePerMillion", label: "입력" },
  { name: "outputPricePerMillion", label: "출력" },
  { name: "cacheReadPricePerMillion", label: "캐시 읽기" },
  { name: "cacheWritePricePerMillion", label: "캐시 쓰기" },
] as const;

/** 모델별 노트 요금 수정. 모델 튜닝(토큰 · temperature)과 고치는 사람이 달라 모달을 나눴다. */
const ModelPricingFormModal = ({
  model,
  onClose,
  onSubmit,
  isSubmitting,
}: ModelPricingFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AiModelPricingSchema>({
    resolver: zodResolver(aiModelPricingSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 모델의 현재 요금으로 폼을 초기화한다.
  useEffect(() => {
    if (!model) return;

    reset({
      cacheRatioPercent: model.cacheRatioBps / 100,
      priceMultiplier:
        model.priceMultiplierBps === null
          ? ""
          : String(model.priceMultiplierBps / 10_000),
      inputPricePerMillion: model.inputPricePerMillion,
      outputPricePerMillion: model.outputPricePerMillion,
      cacheReadPricePerMillion: model.cacheReadPricePerMillion,
      cacheWritePricePerMillion: model.cacheWritePricePerMillion,
    });
  }, [model, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={model !== null}
      onClose={onClose}
      title="모델 요금 수정"
      description="여기서 바꾼 값은 다음 대화부터 바로 적용됩니다. 이미 노트를 잡은 대화는 잡을 때의 값으로 매깁니다."
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

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {AI_MODEL_ROLES.filter((role) => model.roles.includes(role)).map(
                (role) => (
                  <Badge key={role} tone={AI_MODEL_ROLE_TONE[role]}>
                    {AI_MODEL_ROLE_LABEL[role]}
                  </Badge>
                ),
              )}
              <Badge tone={AI_PROVIDER_TONE[model.provider]}>
                {AI_PROVIDER_LABEL[model.provider]}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="판매 배수 (k)"
              htmlFor="model-pricing-multiplier"
              error={errors.priceMultiplier?.message}
              hint={
                model.priceMultiplierBps === null
                  ? `정책 값 ${model.effectivePriceMultiplier.toFixed(4)} 적용 중`
                  : "비우면 정책 값으로 되돌림"
              }
            >
              <Input
                id="model-pricing-multiplier"
                inputMode="decimal"
                placeholder="과금 정책 값"
                hasError={Boolean(errors.priceMultiplier)}
                {...register("priceMultiplier")}
              />
            </FormField>

            <FormField
              label="평균 캐시 비율 (%)"
              htmlFor="model-pricing-cache-ratio"
              required
              error={errors.cacheRatioPercent?.message}
              hint="청구용 평균값"
            >
              <Input
                id="model-pricing-cache-ratio"
                type="number"
                min={0}
                max={100}
                step={0.01}
                hasError={Boolean(errors.cacheRatioPercent)}
                {...register("cacheRatioPercent", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            label="단가 (100만 토큰당 원)"
            hint="바꾼 뒤 시작한 대화부터 적용"
            error={
              PRICE_FIELDS.map(({ name }) => errors[name]?.message).find(
                Boolean,
              ) ?? undefined
            }
          >
            <div className="grid grid-cols-4 gap-2">
              {PRICE_FIELDS.map(({ name, label }) => (
                <label key={name} className="flex flex-col gap-1">
                  <span className="body-6 text-font-2">{label}</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    aria-label={`${label} 단가`}
                    hasError={Boolean(errors[name])}
                    {...register(name, { valueAsNumber: true })}
                  />
                </label>
              ))}
            </div>
          </FormField>
        </form>
      )}
    </Modal>
  );
};

export default ModelPricingFormModal;
