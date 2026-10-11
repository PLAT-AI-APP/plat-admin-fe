"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useDocsPageQuery } from "@/api/docs/getDocsPage";
import { useDocsMutation } from "@/api/docs/mutateDocs";
import { docsPageSchema, type DocsPageSchema } from "@/schema/docs.schema";
import {
  DOCS_PAGE_STATUS_LABEL,
  type DocsLocale,
  type DocsPageStatus,
} from "@/type/docs";
import { Ban, ExternalLink, FileText, Megaphone, Trash, Upload } from "@/icons";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import DocsMarkdownEditor from "./DocsMarkdownEditor";
import {
  DOCS_PAGE_STATUS_TONE,
  docsArticleUrl,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";
import {
  emptyPageForm,
  slugSourceOrder,
  toPageForm,
  toPagePayload,
} from "@/app/(admin)/communication/docs/_lib/docsForm";
import { useDocsLocales } from "@/app/(admin)/communication/docs/_lib/useDocsLocales";
import {
  fallbackSlug,
  parseMarkdownFile,
  readTextFile,
  slugify,
} from "@/app/(admin)/communication/docs/_lib/docsMarkdown";

interface DocsPageEditorProps {
  /** 고친다면 페이지 ID, 새로 만든다면 `null` */
  pageId: string | null;
  /** 새로 만들 때 넣을 그룹 */
  groupId: string | null;
  /** 최상위부터 부모 그룹까지 이름 */
  path: string[];
  canWrite: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onCreated: (pageId: string) => void;
  onDelete: () => void;
  onDirtyChange: (isDirty: boolean) => void;
}

/** 상태마다 옮겨 갈 수 있는 상태. 게시 중인 글을 곧바로 초안으로 돌리는 것도 허용한다. */
const NEXT_STATUSES: Record<DocsPageStatus, DocsPageStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["HIDDEN", "DRAFT"],
  HIDDEN: ["PUBLISHED", "DRAFT"],
};

const STATUS_ACTION_LABEL: Record<DocsPageStatus, string> = {
  PUBLISHED: "게시",
  HIDDEN: "숨김",
  DRAFT: "초안으로",
};

const STATUS_ACTION_ICON: Record<DocsPageStatus, ReactNode> = {
  PUBLISHED: <Megaphone size={14} />,
  HIDDEN: <Ban size={14} />,
  DRAFT: <FileText size={14} />,
};

/**
 * 페이지 편집 패널. 트리에서 페이지를 누르면 오른쪽에 바로 열린다.
 *
 * 본문 · 제목은 '저장'으로, 게시 상태는 머리의 버튼으로 따로 바꾼다 — 서버가 상태를
 * 게시 권한(`docs:publish`)으로 따로 지키기 때문이다. 새 페이지는 언제나 초안으로 만든다.
 */
const DocsPageEditor = ({
  pageId,
  groupId,
  path,
  canWrite,
  canDelete,
  canPublish,
  onCreated,
  onDelete,
  onDirtyChange,
}: DocsPageEditorProps) => {
  const isCreate = pageId === null;
  const { defaultLocale, locales, codes, labelOf } = useDocsLocales();
  const [locale, setLocale] = useState<DocsLocale>(defaultLocale);
  const [isSlugTouched, setIsSlugTouched] = useState(!isCreate);
  const [relativeImages, setRelativeImages] = useState<string[]>([]);
  const mdInputRef = useRef<HTMLInputElement>(null);

  const { data: page, isLoading, isError } = useDocsPageQuery(pageId);
  const { createPageMutation, updatePageMutation, pageStatusMutation } =
    useDocsMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<DocsPageSchema>({
    resolver: zodResolver(docsPageSchema),
    defaultValues: emptyPageForm(codes),
  });

  useEffect(() => {
    if (page) reset(toPageForm(page, codes));
  }, [page, codes, reset]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const [translations, slug] = useWatch({
    control,
    name: ["translations", "slug"],
  });

  /** 지원 언어 중 영어를 먼저 보고, 처음으로 slug 가 되는 제목을 쓴다. */
  const slugFromTitles = () => {
    const current = getValues("translations");

    return slugSourceOrder(codes)
      .map((code) => slugify(current[code]?.title ?? ""))
      .find(Boolean);
  };

  const suggestSlug = () => {
    if (isSlugTouched) return;

    setValue("slug", slugFromTitles() ?? "", { shouldDirty: true });
  };

  const submit = handleSubmit((values) => {
    const payload = toPagePayload(values, codes);

    if (isCreate) {
      if (!groupId) return;

      createPageMutation.mutate(
        { ...payload, groupId, status: "DRAFT" },
        {
          onSuccess: (created) => {
            reset(values);
            onCreated(created.id);
          },
        },
      );
      return;
    }

    updatePageMutation.mutate(
      { pageId, values: payload },
      { onSuccess: (updated) => reset(toPageForm(updated, codes)) },
    );
  });

  const errorLocale = codes.find((code) => errors.translations?.[code]);
  const handleSave = () => {
    if (errorLocale && errorLocale !== locale) setLocale(errorLocale);
    submit();
  };

  /* ---------------------------------------------------------------- */
  /* 게시 상태                                                           */
  /* ---------------------------------------------------------------- */

  const changeStatus = (status: DocsPageStatus) => {
    if (!page) return;

    const title =
      codes.map((code) => translations?.[code]?.title).find(Boolean) || page.slug;
    const unsaved = isDirty
      ? "저장하지 않은 수정 내용은 반영되지 않습니다. 먼저 저장해 주세요."
      : undefined;
    const run = () =>
      pageStatusMutation.mutateAsync({ pageId: page.id, status });

    if (status === "PUBLISHED") {
      openConfirm({
        title: "페이지를 게시할까요?",
        description: `'${truncate(title, 30)}' 페이지가 사용자 사이트에 바로 보입니다. 번역이 있는 언어에서만 보입니다.`,
        warning: unsaved,
        confirmText: "게시",
        onConfirm: run,
      });
      return;
    }

    if (unsaved) {
      openConfirm({
        title: `'${STATUS_ACTION_LABEL[status]}' 상태로 바꿀까요?`,
        description: unsaved,
        confirmText: "바꾸기",
        onConfirm: run,
      });
      return;
    }

    run().catch(() => undefined);
  };

  /* ---------------------------------------------------------------- */
  /* .md 불러오기                                                        */
  /* ---------------------------------------------------------------- */

  const applyMarkdown = async (file: File) => {
    try {
      const parsed = parseMarkdownFile(await readTextFile(file));

      const fill = () => {
        const options = { shouldDirty: true, shouldValidate: false };

        if (parsed.title) setValue(`translations.${locale}.title`, parsed.title, options);
        if (parsed.summary) {
          setValue(`translations.${locale}.summary`, parsed.summary, options);
        }
        setValue(`translations.${locale}.content`, parsed.content, options);

        if (!isSlugTouched) {
          setValue(
            "slug",
            parsed.slug || slugFromTitles() || slugify(parsed.title),
            options,
          );
        }

        setRelativeImages(parsed.relativeImages);
        showAppToast(
          "success",
          `${file.name} 을(를) ${labelOf(locale)} 칸에 불러왔습니다.`,
        );
      };

      const current = getValues(`translations.${locale}`);
      if (current?.title || current?.content.trim()) {
        openConfirm({
          title: `${labelOf(locale)} 내용을 바꿀까요?`,
          description: `지금 입력한 ${labelOf(locale)} 제목 · 요약 · 본문이 '${file.name}' 내용으로 바뀝니다. 저장하기 전까지는 서버에 반영되지 않습니다.`,
          confirmText: "불러오기",
          onConfirm: fill,
        });
        return;
      }

      fill();
    } catch (error) {
      showErrorToast(error, "파일을 읽지 못했습니다.");
    }
  };

  const isSaving = createPageMutation.isPending || updatePageMutation.isPending;
  const isReadOnly = !canWrite;
  const localeTabs = locales.map(({ code, name }) => ({
    value: code,
    label: translations?.[code]?.title?.trim() ? name : `${name} (없음)`,
  }));

  /** 저장된 번역이 있는 언어만 사이트에서 볼 수 있다. */
  const savedLocales = page?.translations.map((item) => item.locale) ?? [];
  const siteUrl =
    page && savedLocales.includes(locale)
      ? docsArticleUrl(locale, page.slug, page.id)
      : null;

  if (isError) {
    return (
      <Alert tone="danger" title="페이지를 불러오지 못했습니다.">
        삭제되었거나 서버에 연결할 수 없습니다. 트리를 새로 고쳐 주세요.
      </Alert>
    );
  }

  return (
    <Card noPadding>
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <p className="body-4 font-semibold text-font-1">
              {isCreate ? "새 페이지" : "페이지 편집"}
            </p>
            {isCreate ? (
              <Badge tone="neutral">초안으로 저장</Badge>
            ) : (
              page && (
                <Badge tone={DOCS_PAGE_STATUS_TONE[page.status]}>
                  {DOCS_PAGE_STATUS_LABEL[page.status]}
                </Badge>
              )
            )}
          </div>
          <p className="truncate body-6 text-font-2">
            {isCreate ? `'${path.join(" › ")}' 그룹에 만듭니다.` : path.join(" › ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {page &&
            canPublish &&
            NEXT_STATUSES[page.status].map((status) => (
              <Button
                key={status}
                size="sm"
                variant="secondary"
                leftIcon={STATUS_ACTION_ICON[status]}
                disabled={pageStatusMutation.isPending}
                onClick={() => changeStatus(status)}
              >
                {STATUS_ACTION_LABEL[status]}
              </Button>
            ))}

          {!isCreate && canDelete && (
            <Button
              size="sm"
              variant="dangerGhost"
              leftIcon={<Trash size={14} />}
              onClick={onDelete}
            >
              삭제
            </Button>
          )}

          {canWrite && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || (!isCreate && !isDirty)}
            >
              {isCreate ? "만들기" : "저장"}
            </Button>
          )}
        </div>
      </div>

      {!isCreate && isLoading ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-4 p-5"
        >
          <div className="flex items-end justify-between gap-3">
            <Tabs
              items={localeTabs}
              value={locale}
              onChange={setLocale}
              className="flex-1"
            />

            <div className="flex shrink-0 items-center gap-1.5 pb-1">
              {siteUrl && (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2 body-5 text-font-2 transition hover:text-font-1"
                  title={
                    page?.status === "PUBLISHED"
                      ? undefined
                      : "게시 전에는 사용자 사이트에서 열리지 않습니다."
                  }
                >
                  <ExternalLink size={14} />
                  사이트에서 보기
                </a>
              )}

              {canWrite && (
                <>
                  <input
                    ref={mdInputRef}
                    type="file"
                    accept=".md,.markdown,text/markdown"
                    className="hidden"
                    onChange={(event) => {
                      const [file] = Array.from(event.target.files ?? []);
                      if (file) applyMarkdown(file);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Upload size={14} />}
                    onClick={() => mdInputRef.current?.click()}
                  >
                    .md 불러오기
                  </Button>
                </>
              )}
            </div>
          </div>

          {relativeImages.length > 0 && (
            <Alert
              tone="warning"
              title={`상대경로 이미지 ${relativeImages.length}개는 사이트에서 보이지 않습니다.`}
              action={
                <Button size="sm" variant="ghost" onClick={() => setRelativeImages([])}>
                  닫기
                </Button>
              }
            >
              {truncate(relativeImages.join(", "), 120)} — 이미지를 본문에 다시 올려 주소를
              바꿔 주세요.
            </Alert>
          )}

          {codes.map((key) => (
            <div key={key} hidden={key !== locale} className="flex flex-col gap-1">
              <FormField
                label="제목"
                htmlFor={`docs-page-title-${key}`}
                error={errors.translations?.[key]?.title?.message}
                hint="최대 100자 · 비우면 이 언어 번역이 없어집니다"
              >
                <Input
                  id={`docs-page-title-${key}`}
                  placeholder={key === "ko" ? "첫 대화하기" : "Your first chat"}
                  disabled={isReadOnly}
                  hasError={Boolean(errors.translations?.[key]?.title)}
                  {...register(`translations.${key}.title`, { onChange: suggestSlug })}
                />
              </FormField>

              <FormField
                label="요약"
                htmlFor={`docs-page-summary-${key}`}
                error={errors.translations?.[key]?.summary?.message}
                hint="최대 300자 · 목록 · 검색 결과에 보입니다"
              >
                <Textarea
                  id={`docs-page-summary-${key}`}
                  rows={2}
                  disabled={isReadOnly}
                  hasError={Boolean(errors.translations?.[key]?.summary)}
                  {...register(`translations.${key}.summary`)}
                />
              </FormField>

              <FormField label="본문" error={errors.translations?.[key]?.content?.message}>
                <Controller
                  control={control}
                  name={`translations.${key}.content`}
                  render={({ field }) => (
                    <DocsMarkdownEditor
                      value={field.value}
                      onChange={field.onChange}
                      hasError={Boolean(errors.translations?.[key]?.content)}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </FormField>
            </div>
          ))}

          <FormField
            label="slug"
            htmlFor="docs-page-slug"
            required
            error={errors.slug?.message}
            labelSuffix={
              canWrite && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => {
                    setIsSlugTouched(true);
                    setValue("slug", fallbackSlug("page"), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  임시 slug
                </Button>
              )
            }
            hint={
              page
                ? `주소: /docs/${locale}/articles/${slug || "…"}-${page.id}`
                : "영문 소문자 · 숫자 · 하이픈. 한글 제목이면 직접 적어 주세요."
            }
          >
            <Input
              id="docs-page-slug"
              placeholder="first-chat"
              disabled={isReadOnly}
              hasError={Boolean(errors.slug)}
              inputBoxClassName="max-w-120"
              {...register("slug", { onChange: () => setIsSlugTouched(true) })}
            />
          </FormField>
        </form>
      )}
    </Card>
  );
};

export default DocsPageEditor;
