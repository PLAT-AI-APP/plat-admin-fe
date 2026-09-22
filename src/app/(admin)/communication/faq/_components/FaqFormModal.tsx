"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { faqSchema, type FaqSchema } from "@/schema/faq.schema";
import type { FaqFormValues, FaqItem } from "@/type/communication";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { FAQ_CATEGORY_OPTIONS } from "@/app/(admin)/communication/_constants/communicationOptions";

interface FaqFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 목록 응답에 본문까지 있어 상세를 다시 조회하지 않는다. */
  faq?: FaqItem;
  onSubmit: (values: FaqFormValues) => void;
  isSubmitting: boolean;
}

const EMPTY_VALUES: FaqSchema = {
  category: "REFUND",
  question: "",
  answer: "",
  isVisible: true,
};

const FaqFormModal = ({
  isOpen,
  onClose,
  faq,
  onSubmit,
  isSubmitting,
}: FaqFormModalProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FaqSchema>({
    resolver: zodResolver(faqSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 FAQ 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      faq
        ? {
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            isVisible: faq.isVisible,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, faq, reset]);

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={isOpen}
      onClose={onClose}
      title={faq ? "FAQ 수정" : "FAQ 등록"}
      description="유저 고객센터의 자주 하는 질문에 노출됩니다. 새 질문은 카테고리 맨 아래에 붙습니다."
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {faq ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="카테고리"
          htmlFor="faq-category"
          required
          labelSuffix={
            <Controller
              control={control}
              name="isVisible"
              render={({ field }) => (
                <Checkbox
                  label="유저에게 노출"
                  boxClassName="gap-1.5"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              )}
            />
          }
        >
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                id="faq-category"
                options={FAQ_CATEGORY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField
          label="질문"
          htmlFor="faq-question"
          required
          error={errors.question?.message}
          hint="최대 100자"
        >
          <Input
            id="faq-question"
            placeholder="환불은 어떻게 신청하나요?"
            hasError={Boolean(errors.question)}
            {...register("question")}
          />
        </FormField>

        <FormField
          label="답변"
          htmlFor="faq-answer"
          required
          error={errors.answer?.message}
          hint="최대 2000자 · 줄바꿈은 그대로 노출됩니다."
        >
          <Textarea
            id="faq-answer"
            rows={8}
            placeholder="유저가 따라 할 수 있도록 메뉴 경로까지 적어 주세요."
            hasError={Boolean(errors.answer)}
            {...register("answer")}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default FaqFormModal;
