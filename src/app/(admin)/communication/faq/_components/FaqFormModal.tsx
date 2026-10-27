"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { faqSchema, type FaqSchema } from "@/schema/faq.schema";
import type { FaqFormValues, FaqItem } from "@/type/communication";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
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

type EditorTab = "WRITE" | "PREVIEW";

const EDITOR_TABS = [
  { label: "작성", value: "WRITE" as const },
  { label: "미리보기", value: "PREVIEW" as const },
];

const ANSWER_PLACEHOLDER = [
  "**설정 > 결제 내역**에서 신청할 수 있습니다.",
  "",
  "- 결제 후 7일 이내",
  "- 노트를 사용하지 않은 경우",
].join("\n");

const EMPTY_VALUES: FaqSchema = {
  category: "SERVICE",
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
  const [tab, setTab] = useState<EditorTab>("WRITE");
  const [wasOpen, setWasOpen] = useState(isOpen);

  /* 열릴 때마다 작성 탭에서 시작한다. 이펙트 대신 열림이 바뀐 렌더에서 곧바로 맞춘다. */
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTab("WRITE");
  }

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

  const answer = useWatch({ control, name: "answer" });

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isDirty={isDirty}
      isOpen={isOpen}
      onClose={onClose}
      title={faq ? "FAQ 수정" : "FAQ 등록"}
      description="유저 고객센터의 자주 하는 질문에 노출됩니다. 답변은 마크다운으로 작성하며, 새 질문은 카테고리 맨 아래에 붙습니다."
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
          required
          error={errors.answer?.message}
          hint="최대 5000자 · 마크다운(굵게 · 기울임 · 목록 · 링크 · 인라인 코드 · 제목)을 쓸 수 있고, 줄바꿈은 그대로 노출됩니다."
        >
          <div className="flex flex-col gap-2">
            <Tabs items={EDITOR_TABS} value={tab} onChange={setTab} />

            {tab === "WRITE" ? (
              <Textarea
                id="faq-answer"
                rows={10}
                placeholder={ANSWER_PLACEHOLDER}
                hasError={Boolean(errors.answer)}
                className="font-mono body-5"
                {...register("answer")}
              />
            ) : (
              <div className="min-h-60 rounded-field border border-border-main px-4 py-3 body-4">
                {answer.trim() ? (
                  <MarkdownContent content={answer} />
                ) : (
                  <p className="body-5 text-font-2">
                    작성 탭에서 답변을 입력하면 여기에서 미리 볼 수 있습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </FormField>
      </form>
    </Modal>
  );
};

export default FaqFormModal;
