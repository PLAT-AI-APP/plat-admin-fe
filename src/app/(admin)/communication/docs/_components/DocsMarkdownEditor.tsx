"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { postDocsImage } from "@/api/docs/postDocsImage";
import { ImageIcon } from "@/icons";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import {
  DOCS_IMAGE_MAX_SIZE,
  DOCS_IMAGE_MIME_TYPES,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";

interface DocsMarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

/** 업로드 중인 이미지 자리표시. 업로드가 끝나면 같은 문자열을 찾아 진짜 주소로 바꾼다. */
const placeholderOf = (token: string, name: string) =>
  `![${name} 업로드 중… ${token}]()`;

/** 마크다운 대체 텍스트에서 깨지는 글자를 걷어 낸다. */
const altOf = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "") || "이미지";

/**
 * 가이드 문서 본문 편집기.
 *
 * 미리보기는 두지 않는다. 게시한 모습은 사이트에서 본다.
 *
 * 이미지는 버튼 · 붙여넣기 · 끌어다 놓기로 올리고, 올리는 동안 커서 자리에
 * 자리표시를 먼저 넣어 둔다. 업로드가 끝나기 전에 계속 써도 자리가 밀리지 않는다.
 */
const DocsMarkdownEditor = ({
  id,
  value,
  onChange,
  hasError = false,
  disabled = false,
}: DocsMarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  /** 지금 입력칸의 값. 업로드가 끝나는 시점에는 렌더 때 받은 `value` 가 이미 낡았다. */
  const currentValue = () => textareaRef.current?.value ?? value;

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    const source = currentValue();
    const start = textarea?.selectionStart ?? source.length;
    const end = textarea?.selectionEnd ?? source.length;

    /* 이미지는 문단 하나로 두어야 글 사이에 끼지 않는다. */
    const before = source.slice(0, start);
    const after = source.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const trail = after.startsWith("\n") ? "" : "\n";
    const inserted = `${lead}${text}${trail}`;

    onChange(`${before}${inserted}${after}`);

    requestAnimationFrame(() => {
      const caret = start + inserted.length;
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
    });
  };

  const replaceInValue = (from: string, to: string) => {
    const source = currentValue();
    if (!source.includes(from)) return;

    onChange(source.replace(from, to));
  };

  const uploadImages = async (files: File[]) => {
    const images = files.filter((file) => {
      if (!DOCS_IMAGE_MIME_TYPES.includes(file.type)) {
        showAppToast(
          "warning",
          `${file.name}: JPG · PNG · WEBP · GIF 만 올릴 수 있습니다.`,
        );
        return false;
      }

      if (file.size > DOCS_IMAGE_MAX_SIZE) {
        showAppToast(
          "warning",
          `${file.name}: 10MB 이하 이미지만 올릴 수 있습니다.`,
        );
        return false;
      }

      return true;
    });

    if (images.length === 0) return;

    const jobs = images.map((file, index) => ({
      file,
      placeholder: placeholderOf(`#${Date.now()}-${index}`, altOf(file.name)),
    }));

    insertAtCursor(jobs.map((job) => job.placeholder).join("\n\n"));
    setUploadingCount((count) => count + jobs.length);

    await Promise.all(
      jobs.map(async ({ file, placeholder }) => {
        try {
          const { url } = await postDocsImage(file);
          replaceInValue(placeholder, `![${altOf(file.name)}](${url})`);
        } catch (error) {
          replaceInValue(placeholder, "");
          showErrorToast(error, `${file.name} 을(를) 올리지 못했습니다.`);
        } finally {
          setUploadingCount((count) => count - 1);
        }
      }),
    );
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;

    event.preventDefault();
    uploadImages(files);
  };

  const handleDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    event.preventDefault();
    uploadImages(files);
  };

  const editor = (
    <Textarea
      id={id}
      ref={textareaRef}
      rows={24}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onPaste={handlePaste}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      placeholder={
        "## 소제목\n\n내용을 마크다운으로 입력하세요.\n이미지는 붙여넣거나 끌어다 놓으면 올라갑니다."
      }
      hasError={hasError}
      className={cn(
        "min-h-120 font-mono body-5",
        isDragging && "border-brand bg-brand-opacity-3",
      )}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1.5">
        {uploadingCount > 0 && (
          <span className="flex items-center gap-1.5 body-6 text-font-2">
            <Spinner size={13} className="text-brand" />
            이미지 {uploadingCount}개 올리는 중
          </span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={DOCS_IMAGE_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            uploadImages(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ImageIcon size={14} />}
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          이미지
        </Button>
      </div>

      {editor}
    </div>
  );
};

export default DocsMarkdownEditor;
