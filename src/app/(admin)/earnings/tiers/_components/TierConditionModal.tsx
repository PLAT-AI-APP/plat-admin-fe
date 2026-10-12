"use client";

import { useState } from "react";
import { openConfirm } from "@/store/useConfirmStore";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import IconButton from "@/components/ui/IconButton";
import Textarea from "@/components/ui/Textarea";
import { Plus, Trash } from "@/icons";
import { TIER_NAME } from "@/components/creatorTier/tierMeta";
import type {
  TierBenefit,
  TierDefinition,
  TierDefinitionFormValues,
} from "@/type/creatorTier";

const FIELDS = [
  { key: "minPublicUniverses", label: "공개 캐릭터", unit: "개" },
  { key: "minPaidTurns", label: "누적 유료 대화", unit: "회" },
  { key: "minFollowers", label: "팔로워", unit: "명" },
] as const;

type ConditionKey = (typeof FIELDS)[number]["key"];

interface TierConditionModalProps {
  tier: TierDefinition;
  isSubmitting: boolean;
  onClose: () => void;
  /** 서버 응답까지 기다린다. 실패하면 모달은 입력을 그대로 들고 남는다. */
  onSubmit: (values: TierDefinitionFormValues) => Promise<unknown>;
}

const sameBenefits = (a: TierBenefit[], b: TierBenefit[]) =>
  a.length === b.length &&
  a.every(
    (benefit, index) =>
      benefit.label === b[index].label && benefit.value === b[index].value,
  );

/** 승급 조건과 그 밖의 혜택 수정. 등급 자체(이름·뱃지·수익률)는 고정이다. */
const TierConditionModal = ({
  tier,
  isSubmitting,
  onClose,
  onSubmit,
}: TierConditionModalProps) => {
  const [values, setValues] = useState<Record<ConditionKey, string>>(
    Object.fromEntries(
      FIELDS.map((field) => [field.key, String(tier[field.key])]),
    ) as Record<ConditionKey, string>,
  );
  const [benefits, setBenefits] = useState<TierBenefit[]>(tier.benefits);
  const [memo, setMemo] = useState("");

  const setBenefit = (index: number, patch: Partial<TierBenefit>) =>
    setBenefits((prev) =>
      prev.map((benefit, i) =>
        i === index ? { ...benefit, ...patch } : benefit,
      ),
    );

  const cleanBenefits = benefits
    .map((benefit) => ({
      label: benefit.label.trim(),
      value: benefit.value.trim(),
    }))
    .filter((benefit) => benefit.label);
  const numbers = Object.fromEntries(
    FIELDS.map((field) => [field.key, Number(values[field.key])]),
  ) as Record<ConditionKey, number>;
  const changed =
    FIELDS.some((field) => numbers[field.key] !== tier[field.key]) ||
    !sameBenefits(cleanBenefits, tier.benefits);
  const isInvalid =
    !changed ||
    !memo.trim() ||
    cleanBenefits.some((benefit) => !benefit.value) ||
    FIELDS.some(
      (field) =>
        values[field.key] === "" ||
        !Number.isInteger(numbers[field.key]) ||
        numbers[field.key] < 0,
    );

  return (
    <Modal
      isOpen
      size="md"
      onClose={onClose}
      title={`${TIER_NAME[tier.code]} 수정`}
      description="세 조건을 모두 채우면 제작자가 승급을 신청할 수 있습니다. 이미 오른 제작자의 등급은 그대로 유지됩니다."
      isDirty={changed || memo.length > 0}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={isInvalid || isSubmitting}
            onClick={() =>
              openConfirm({
                title: `${TIER_NAME[tier.code]} 등급을 저장할까요?`,
                description: "제작자 등급 화면에 바로 반영됩니다.",
                confirmText: "저장",
                onConfirm: () =>
                  onSubmit({
                    ...numbers,
                    benefits: cleanBenefits,
                    memo: memo.trim(),
                  }).then(() => undefined),
              })
            }
          >
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <h3 className="body-4 font-semibold">승급 조건</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {FIELDS.map((field) => (
            <FormField
              key={field.key}
              label={`${field.label} (${field.unit})`}
              required
            >
              <Input
                type="number"
                min={0}
                className="text-right font-mono"
                value={values[field.key]}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </FormField>
          ))}
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="body-4 font-semibold">그 밖의 혜택</h3>
              <p className="body-6 text-font-2">
                제작자 등급 화면에 이 순서대로 보입니다.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus size={14} />}
              disabled={benefits.length >= 20}
              onClick={() =>
                setBenefits((prev) => [...prev, { label: "", value: "" }])
              }
            >
              혜택 추가
            </Button>
          </div>
          {benefits.length === 0 ? (
            <p className="body-5 text-font-2">없음</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[1fr_140px_auto] items-center gap-2"
                >
                  <Input
                    aria-label="혜택 이름"
                    placeholder="혜택 이름"
                    maxLength={40}
                    value={benefit.label}
                    onChange={(event) =>
                      setBenefit(index, { label: event.target.value })
                    }
                  />
                  <Input
                    aria-label="혜택 값"
                    placeholder="값 (예: 지원)"
                    maxLength={40}
                    value={benefit.value}
                    onChange={(event) =>
                      setBenefit(index, { value: event.target.value })
                    }
                  />
                  <IconButton
                    label="혜택 삭제"
                    icon={<Trash size={16} />}
                    onClick={() =>
                      setBenefits((prev) => prev.filter((_, i) => i !== index))
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <FormField label="사유" required hint="기준 변경 이력에 남습니다.">
          <Textarea
            rows={2}
            maxLength={500}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default TierConditionModal;
