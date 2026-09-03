"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toDateInputValue } from "@/lib/dayjs";
import {
  legalDocumentSchema,
  type LegalDocumentSchema,
} from "@/schema/legalDocument.schema";
import type { LegalDocumentFormValues, LegalDocumentType } from "@/type/legal";
import { LEGAL_DOCUMENT_LABEL } from "@/type/legal";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface LegalDocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 현재 탭의 문서 타입. 등록 대상은 항상 보고 있는 탭이다. */
  documentType: LegalDocumentType;
  onSubmit: (values: LegalDocumentFormValues) => void;
  isSubmitting: boolean;
}

const LegalDocumentFormModal = ({
  isOpen,
  onClose,
  documentType,
  onSubmit,
  isSubmitting,
}: LegalDocumentFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LegalDocumentSchema>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: {
      documentType,
      version: "",
      effectiveAt: "",
      content: "",
    },
  });

  // 새 버전 등록은 1회성 작업이므로 열 때마다 현재 탭 기준 빈 폼에서 시작한다.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      documentType,
      version: "",
      effectiveAt: toDateInputValue(new Date()),
      content: "",
    });
  }, [isOpen, documentType, reset]);

  const content = watch("content");

  const submit = handleSubmit((formValues) => onSubmit(formValues));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${LEGAL_DOCUMENT_LABEL[documentType]} 새 버전 등록`}
      description="등록한 버전은 비활성 상태로 저장되며, 활성 지정은 별도로 진행합니다."
      size="xl"
      // 긴 본문을 입력하는 폼이라 오버레이 클릭으로 닫지 않는다.
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            등록
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="버전"
            htmlFor="legal-version"
            required
            error={errors.version?.message}
            hint="1.0.0 형식"
          >
            <Input
              id="legal-version"
              placeholder="2.1.0"
              className="tabular-nums"
              hasError={Boolean(errors.version)}
              {...register("version")}
            />
          </FormField>

          <FormField
            label="시행일"
            htmlFor="legal-effective-at"
            required
            error={errors.effectiveAt?.message}
          >
            <Input
              id="legal-effective-at"
              type="date"
              className="tabular-nums"
              hasError={Boolean(errors.effectiveAt)}
              {...register("effectiveAt")}
            />
          </FormField>
        </div>

        {/* 작성한 마크다운이 실제로 어떻게 보이는지 옆에서 바로 확인한다. */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="본문 (마크다운)"
            htmlFor="legal-content"
            required
            error={errors.content?.message}
          >
            <Textarea
              id="legal-content"
              rows={18}
              placeholder={"# 서비스 이용약관\n\n## 제1조 (목적)\n..."}
              className="h-100 resize-none font-mono body-5"
              hasError={Boolean(errors.content)}
              {...register("content")}
            />
          </FormField>

          <FormField label="미리보기" hint="저장 전 최종 확인">
            <div className="h-100 overflow-y-auto rounded-field border border-border-main bg-subtle px-4 py-3 scrollbar-thin">
              {content ? (
                <MarkdownContent content={content} />
              ) : (
                <p className="body-5 text-font-disabled">
                  본문을 입력하면 여기에서 렌더링 결과를 확인할 수 있습니다.
                </p>
              )}
            </div>
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default LegalDocumentFormModal;
