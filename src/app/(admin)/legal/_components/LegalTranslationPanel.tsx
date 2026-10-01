"use client";

import { useState } from "react";
import {
  useLegalTranslationMutation,
  useLegalTranslationsQuery,
} from "@/api/legal/legalTranslation";
import { formatDateTime } from "@/lib/dayjs";
import { formatAdmin } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import {
  LEGAL_TRANSLATION_LANGUAGES,
  type LegalTranslationLanguage,
} from "@/type/legal";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Skeleton from "@/components/ui/Skeleton";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";

type PanelTab = "KO" | LegalTranslationLanguage;

/** 서버 검증과 같은 길이 제한(원문과 같다). */
const MIN_LENGTH = 20;
const MAX_LENGTH = 50_000;

interface LegalTranslationPanelProps {
  documentId: string;
  /** 한국어 원문(버전 본문) */
  originalContent: string;
}

/**
 * 약관 버전 하나의 원문과 언어별 번역본.
 *
 * 번역본은 이해를 돕는 참고용이라, 원문과 달리 게시한 버전에도 올리고 고치고 내릴 수 있다. 재동의로 이어지지 않는다.
 * 서비스 약관 페이지는 사용자 언어의 번역본이 있으면 그것을, 없으면 한국어 원문을 보여 준다.
 */
const LegalTranslationPanel = ({
  documentId,
  originalContent,
}: LegalTranslationPanelProps) => {
  const canWrite = useHasPermission("legal:write");
  /* 번역 내리기는 서버에서 `legal:delete` 다. */
  const canDelete = useHasPermission("legal:delete");
  const { data: translations = [], isLoading } =
    useLegalTranslationsQuery(documentId);
  const { saveMutation, deleteMutation } = useLegalTranslationMutation();

  const [tab, setTab] = useState<PanelTab>("KO");
  // 편집 중인 언어와 초안. 탭을 옮기면 편집을 접는다.
  const [editing, setEditing] = useState<LegalTranslationLanguage | null>(null);
  const [draft, setDraft] = useState("");

  const translationOf = (language: LegalTranslationLanguage) =>
    translations.find((item) => item.language === language);

  const tabs: TabItem<PanelTab>[] = [
    { label: "한국어 원문", value: "KO" },
    ...LEGAL_TRANSLATION_LANGUAGES.map(({ value, label }) => ({
      label: translationOf(value) ? label : `${label} · 없음`,
      value,
    })),
  ];

  const handleTabChange = (next: PanelTab) => {
    setTab(next);
    setEditing(null);
  };

  const startEditing = (language: LegalTranslationLanguage) => {
    setEditing(language);
    setDraft(translationOf(language)?.content ?? "");
  };

  const trimmedLength = draft.trim().length;
  const draftError =
    trimmedLength < MIN_LENGTH
      ? `본문은 ${MIN_LENGTH}자 이상이어야 합니다.`
      : trimmedLength > MAX_LENGTH
        ? `본문은 ${MAX_LENGTH.toLocaleString()}자 이하여야 합니다.`
        : null;

  const handleSave = (language: LegalTranslationLanguage) => {
    if (draftError) return;
    saveMutation.mutate(
      { documentId, language, content: draft.trim() },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (language: LegalTranslationLanguage, label: string) =>
    openConfirm({
      title: `${label} 번역본을 내릴까요?`,
      description: "내리면 이 언어 사용자에게는 한국어 원문이 보입니다.",
      confirmText: "내리기",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync({ documentId, language }),
    });

  const renderTranslation = (language: LegalTranslationLanguage) => {
    const label =
      LEGAL_TRANSLATION_LANGUAGES.find((item) => item.value === language)
        ?.label ?? language;
    const translation = translationOf(language);

    if (editing === language) {
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              aria-label={`${label} 번역본 (마크다운)`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={18}
              placeholder={"# Terms of Service\n\n## Article 1 (Purpose)\n..."}
              className="h-100 resize-none font-mono body-5"
              hasError={Boolean(draft) && Boolean(draftError)}
            />
            <div className="h-100 overflow-y-auto rounded-field border border-border-main bg-subtle px-4 py-3 scrollbar-thin">
              {draft ? (
                <MarkdownContent content={draft} />
              ) : (
                <p className="body-5 text-font-disabled">
                  번역본을 입력하면 여기에서 렌더링 결과를 확인할 수 있습니다.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="body-6 text-font-2 tabular-nums">
              {trimmedLength.toLocaleString()}자
              {draft && draftError ? ` · ${draftError}` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave(language)}
                disabled={Boolean(draftError)}
                isLoading={saveMutation.isPending}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!translation) {
      return (
        <EmptyState
          title={`${label} 번역본이 없습니다.`}
          description="지금은 이 언어 사용자에게 한국어 원문이 보입니다."
          action={
            canWrite && (
              <Button variant="primary" onClick={() => startEditing(language)}>
                번역본 추가
              </Button>
            )
          }
        />
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="body-5 text-font-2">
            수정 {formatDateTime(translation.updatedAt)} ·{" "}
            {formatAdmin(
              translation.updatedBy,
              translation.updatedById ?? undefined,
            )}
          </span>
          {(canWrite || canDelete) && (
            <div className="flex gap-2">
              {canDelete && (
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(language, label)}
                >
                  내리기
                </Button>
              )}
              {canWrite && (
                <Button
                  variant="secondary"
                  onClick={() => startEditing(language)}
                >
                  수정
                </Button>
              )}
            </div>
          )}
        </div>
        <MarkdownContent content={translation.content} />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs items={tabs} value={tab} onChange={handleTabChange} />

      {tab !== "KO" && (
        <Alert tone="info" title="번역본은 참고용입니다.">
          동의는 버전 단위로 받고 효력은 한국어 원문이 가집니다. 게시한 버전에도
          번역본을 올리거나 고칠 수 있으며, 재동의로 이어지지 않습니다.
        </Alert>
      )}

      {tab === "KO" ? (
        <MarkdownContent content={originalContent} />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        renderTranslation(tab)
      )}
    </div>
  );
};

export default LegalTranslationPanel;
