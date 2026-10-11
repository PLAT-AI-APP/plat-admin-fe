"use client";

import { useRef, useState } from "react";
import { Trash, Upload } from "@/icons";
import { showErrorToast } from "@/lib/toast";
import type { DocsBulkPage, DocsLocale } from "@/type/docs";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import {
  DOCS_BULK_MAX,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";
import {
  fallbackSlug,
  isValidSlug,
  parseMarkdownFile,
  readTextFile,
  slugFromFileName,
  slugify,
  type ParsedMarkdown,
} from "@/app/(admin)/communication/docs/_lib/docsMarkdown";
import { useDocsLocales } from "@/app/(admin)/communication/docs/_lib/useDocsLocales";

interface DocsBulkUploadModalProps {
  /** 올릴 그룹. 없으면 닫혀 있다. */
  groupId: string | null;
  groupName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (pages: DocsBulkPage[]) => void;
}

interface BulkRow extends ParsedMarkdown {
  key: string;
  fileName: string;
}

/** 한 행에서 막히는 이유. 없으면 올릴 수 있다. */
const rowProblem = (row: BulkRow): string | null => {
  if (!row.title) return "제목이 없습니다. front-matter title 이나 # 제목을 넣어 주세요.";
  if (!isValidSlug(row.slug)) return "slug 는 영문 소문자 · 숫자 · 하이픈만 쓸 수 있습니다.";
  if (row.content.length > 200_000) return "본문이 200,000자를 넘습니다.";
  return null;
};

/**
 * 여러 `.md` 를 한 그룹에 한 번에 올린다. 모두 **초안**으로 들어가므로 게시 전에
 * 하나씩 열어 확인할 수 있다. 한 파일은 한 언어 번역이 된다.
 */
const DocsBulkUploadModal = ({
  groupId,
  groupName,
  isSubmitting,
  onClose,
  onSubmit,
}: DocsBulkUploadModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { defaultLocale, locales, labelOf } = useDocsLocales();
  /* 창은 늘 떠 있어 지원 언어를 받기 전에 그려질 수 있다. 고르기 전에는 기본 언어를 따른다. */
  const [chosenLocale, setLocale] = useState<DocsLocale | null>(null);
  const locale = chosenLocale ?? defaultLocale;
  const localeOptions = locales.map(({ code, name }) => ({ label: name, value: code }));
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [openedFor, setOpenedFor] = useState<string | null>(groupId);

  if (groupId !== openedFor) {
    setOpenedFor(groupId);
    setRows([]);
  }

  const addFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []).filter((file) =>
      /\.(md|markdown)$/i.test(file.name),
    );

    try {
      const seed = Date.now();
      const parsed = await Promise.all(
        files.map(async (file, index) => {
          const markdown = parseMarkdownFile(await readTextFile(file));

          return {
            ...markdown,
            key: `${file.name}-${seed}-${index}`,
            fileName: file.name,
            slug:
              markdown.slug ||
              slugFromFileName(file.name) ||
              slugify(markdown.title) ||
              fallbackSlug("page", seed + index),
          };
        }),
      );

      setRows((current) => [...current, ...parsed].slice(0, DOCS_BULK_MAX));
    } catch (error) {
      showErrorToast(error, "파일을 읽지 못했습니다.");
    }
  };

  const updateSlug = (key: string, slug: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, slug } : row)),
    );

  const removeRow = (key: string) =>
    setRows((current) => current.filter((row) => row.key !== key));

  const problems = rows.filter((row) => rowProblem(row));
  const relativeImageCount = rows.reduce(
    (sum, row) => sum + row.relativeImages.length,
    0,
  );

  const submit = () => {
    if (rows.length === 0 || problems.length > 0) return;

    onSubmit(
      rows.map((row) => ({
        slug: row.slug,
        translations: [
          {
            locale,
            title: row.title,
            summary: row.summary || null,
            content: row.content,
          },
        ],
      })),
    );
  };

  const columns: TableColumn<BulkRow>[] = [
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <TableCellStack
          primary={
            <span className={row.title ? "text-font-1" : "text-font-error"}>
              {row.title || "제목 없음"}
            </span>
          }
          secondary={row.fileName}
        />
      ),
    },
    {
      key: "slug",
      header: "slug",
      width: "220px",
      render: (row) => (
        <Input
          aria-label={`${row.fileName} slug`}
          value={row.slug}
          hasError={!isValidSlug(row.slug)}
          inputBoxClassName="h-8"
          onChange={(event) => updateSlug(row.key, event.target.value)}
        />
      ),
    },
    {
      key: "note",
      header: "확인",
      width: "200px",
      render: (row) => {
        const problem = rowProblem(row);

        if (problem) return <span className="body-6 text-font-error">{problem}</span>;
        if (row.relativeImages.length > 0) {
          return (
            <span className="body-6 text-warning">
              상대경로 이미지 {row.relativeImages.length}개
            </span>
          );
        }
        return <span className="body-6 text-font-2">올릴 수 있음</span>;
      },
    },
    {
      key: "remove",
      header: "",
      width: "48px",
      align: "center",
      render: (row) => (
        <IconButton
          size="sm"
          label="목록에서 빼기"
          icon={<Trash size={14} />}
          tone="danger"
          onClick={() => removeRow(row.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      isOpen={groupId !== null}
      onClose={onClose}
      isDirty={rows.length > 0}
      title="md 일괄 업로드"
      description={`'${groupName}' 그룹에 페이지를 한 번에 만듭니다. 모두 초안으로 들어갑니다.`}
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            isLoading={isSubmitting}
            disabled={rows.length === 0 || problems.length > 0 || isSubmitting}
          >
            {rows.length > 0 ? `${rows.length}개 올리기` : "올리기"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="언어"
            htmlFor="docs-bulk-locale"
            required
            hint="파일 하나가 이 언어 번역 하나가 됩니다"
          >
            <Select
              id="docs-bulk-locale"
              options={localeOptions}
              value={locale}
              onChange={(event) => setLocale(event.target.value as DocsLocale)}
            />
          </FormField>

          <FormField label="파일" hint={`.md · 최대 ${DOCS_BULK_MAX}개`}>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".md,.markdown,text/markdown"
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              leftIcon={<Upload size={15} />}
              onClick={() => inputRef.current?.click()}
              disabled={rows.length >= DOCS_BULK_MAX}
            >
              .md 파일 고르기
            </Button>
          </FormField>
        </div>

        {relativeImageCount > 0 && (
          <Alert tone="warning" title={`상대경로 이미지 ${relativeImageCount}개가 있습니다.`}>
            올린 뒤 각 페이지에서 이미지를 다시 올려 주소를 바꿔야 사이트에서 보입니다.
          </Alert>
        )}

        <Table
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.key}
            skeletonRows={3}
            emptyTitle=".md 파일을 골라 주세요."
            emptyDescription={`front-matter 의 title · summary · slug 를 읽고, title 이 없으면 첫 # 제목을 씁니다. (${labelOf(locale)})`}
          />
      </div>
    </Modal>
  );
};

export default DocsBulkUploadModal;
