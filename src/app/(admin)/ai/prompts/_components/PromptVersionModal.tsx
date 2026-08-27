"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  systemPromptSchema,
  type SystemPromptSchema,
} from "@/schema/systemPrompt.schema";
import { formatWithCommas } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import PromptMarkdown from "./PromptMarkdown";

interface PromptVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 화면에 표시할 프롬프트 이름 */
  promptLabel: string;
  /** 새 버전이 부여받을 번호 */
  nextVersion: number;
  /** 편집 시작점이 되는 현재 활성 버전 본문 */
  initialContent: string;
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}

type EditorTab = "write" | "preview";

const EDITOR_TABS: TabItem<EditorTab>[] = [
  { label: "작성", value: "write" },
  { label: "미리보기", value: "preview" },
];

const PromptVersionModal = ({
  isOpen,
  onClose,
  promptLabel,
  nextVersion,
  initialContent,
  onSubmit,
  isSubmitting,
}: PromptVersionModalProps) => {
  const [tab, setTab] = useState<EditorTab>("write");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SystemPromptSchema>({
    resolver: zodResolver(systemPromptSchema),
    defaultValues: { content: "" },
  });

  // 모달을 열 때마다 현재 활성 버전 본문을 편집 시작점으로 채운다.
  useEffect(() => {
    if (!isOpen) return;

    setTab("write");
    reset({ content: initialContent });
  }, [isOpen, initialContent, reset]);

  const content = watch("content");

  const submit = handleSubmit((values) => onSubmit(values.content));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`새 버전 저장 · v${nextVersion}`}
      description={`'${promptLabel}' 프롬프트의 새 버전을 만듭니다. 저장한 버전은 활성화해야 실제 대화에 적용됩니다.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            새 버전 저장
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Tabs items={EDITOR_TABS} value={tab} onChange={setTab} />

        {/*
          탭을 바꿔도 입력값이 유지되어야 하므로 작성 영역은 언마운트하지 않고 숨긴다.
        */}
        <div className={tab === "write" ? undefined : "hidden"}>
          <FormField
            label="프롬프트 본문"
            htmlFor="system-prompt-content"
            required
            error={errors.content?.message}
            hint={`${formatWithCommas(content.length)} / 8,000자`}
          >
            <Textarea
              id="system-prompt-content"
              rows={16}
              placeholder="마크다운으로 작성할 수 있습니다."
              hasError={Boolean(errors.content)}
              className="font-mono body-5"
              {...register("content")}
            />
          </FormField>
        </div>

        {tab === "preview" && (
          <div className="min-h-[360px] rounded-field border border-border-main px-4 py-3">
            {content.trim() ? (
              <PromptMarkdown content={content} />
            ) : (
              <EmptyState
                title="미리볼 내용이 없습니다."
                description="'작성' 탭에서 프롬프트 본문을 먼저 입력해 주세요."
              />
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default PromptVersionModal;
