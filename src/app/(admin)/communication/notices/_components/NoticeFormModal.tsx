"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { noticeSchema, type NoticeSchema } from "@/schema/notice.schema";
import type { Notice, NoticeFormValues } from "@/type/notice";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import {
  NOTICE_CATEGORY_OPTIONS,
  NOTICE_STATUS_OPTIONS,
} from "./noticeOptions";

interface NoticeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 대상. 없으면 신규 등록 모드다. */
  notice?: Notice;
  onSubmit: (values: NoticeFormValues) => void;
  isSubmitting: boolean;
}

type EditorTab = "WRITE" | "PREVIEW";

const EDITOR_TABS = [
  { label: "작성", value: "WRITE" as const },
  { label: "미리보기", value: "PREVIEW" as const },
];

const EMPTY_VALUES: NoticeSchema = {
  category: "SERVICE",
  title: "",
  content: "",
  status: "DRAFT",
  isPinned: false,
};

const NoticeFormModal = ({
  isOpen,
  onClose,
  notice,
  onSubmit,
  isSubmitting,
}: NoticeFormModalProps) => {
  const [tab, setTab] = useState<EditorTab>("WRITE");

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NoticeSchema>({
    resolver: zodResolver(noticeSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 모달을 열 때마다 대상 공지 값으로 폼을 초기화한다.
  useEffect(() => {
    if (!isOpen) return;

    setTab("WRITE");
    reset(
      notice
        ? {
            category: notice.category,
            title: notice.title,
            content: notice.content,
            status: notice.status,
            isPinned: notice.isPinned,
          }
        : EMPTY_VALUES,
    );
  }, [isOpen, notice, reset]);

  const content = watch("content");

  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={notice ? "공지사항 수정" : "공지사항 등록"}
      description="본문은 마크다운으로 작성합니다. 앱에서는 렌더링된 형태로 노출됩니다."
      size="xl"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            {notice ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="분류" htmlFor="notice-category" required>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  id="notice-category"
                  options={NOTICE_CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>

          <FormField
            label="게시 상태"
            htmlFor="notice-status"
            required
            hint="임시 저장은 앱에 노출되지 않습니다."
          >
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  id="notice-status"
                  options={NOTICE_STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>

        <FormField
          label="제목"
          htmlFor="notice-title"
          required
          error={errors.title?.message}
          hint="최대 60자"
          labelSuffix={
            <Controller
              control={control}
              name="isPinned"
              render={({ field }) => (
                <Checkbox
                  label="고정"
                  boxClassName="gap-1.5"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              )}
            />
          }
        >
          <Input
            id="notice-title"
            placeholder="8월 12일 정기 점검 안내"
            hasError={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>

        <FormField label="본문" required error={errors.content?.message}>
          <div className="flex flex-col gap-2">
            <Tabs items={EDITOR_TABS} value={tab} onChange={setTab} />

            {tab === "WRITE" ? (
              <Textarea
                rows={16}
                placeholder={"# 제목\n\n내용을 입력하세요."}
                hasError={Boolean(errors.content)}
                className="font-mono body-5"
                {...register("content")}
              />
            ) : (
              <div className="min-h-100 rounded-field border border-border-main px-4 py-3 body-4">
                {content ? (
                  <MarkdownContent content={content} />
                ) : (
                  <p className="body-5 text-font-2">
                    작성 탭에서 본문을 입력하면 여기에서 미리 볼 수 있습니다.
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

export default NoticeFormModal;
