"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { postDocsImage } from "@/api/docs/postDocsImage";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Close, Copy, ImageIcon, Layers, Plus } from "@/icons";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EntityImage from "@/components/ui/EntityImage";
import IconButton from "@/components/ui/IconButton";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Spinner from "@/components/ui/Spinner";
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";
import {
  DOCS_IMAGE_MAX_SIZE,
  DOCS_IMAGE_MIME_TYPES,
} from "@/app/(admin)/communication/docs/_constants/docsOptions";

type EditorTab = "WRITE" | "PREVIEW";

const EDITOR_TABS = [
  { label: "작성", value: "WRITE" as const },
  { label: "미리보기", value: "PREVIEW" as const },
];

interface DocsMarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

/** 이번 편집에서 올린 이미지 하나. 자리표시를 지워 버려도 여기서 링크를 다시 가져간다. */
interface UploadItem {
  key: string;
  name: string;
  status: "UPLOADING" | "DONE" | "FAILED";
  url?: string;
}

/** 목록 한 줄. 올린 이미지와, 저장된 본문에 이미 들어 있던 이미지를 함께 보여 준다. */
interface ImageRow {
  key: string;
  name: string;
  status: UploadItem["status"];
  url?: string;
  /** 이번 편집에서 올린 것인지. 아니면 본문에서 찾은 것이다. */
  isUpload: boolean;
}

/** 업로드 중인 이미지 자리표시. 업로드가 끝나면 같은 문자열을 찾아 진짜 주소로 바꾼다. */
const placeholderOf = (token: string, name: string) =>
  `![${name} 업로드 중… ${token}]()`;

/** 마크다운 대체 텍스트에서 깨지는 글자를 걷어 낸다. */
const altOf = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "") || "이미지";

const markdownOf = (name: string, url: string) => `![${name}](${url})`;

/** 본문의 `![alt](url)`. 주소가 빈 것(업로드 중 자리표시)은 건너뛴다. */
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

const imagesInBody = (source: string) => {
  const found = new Map<string, string>();

  for (const [, alt, url] of source.matchAll(MARKDOWN_IMAGE)) {
    if (!found.has(url)) found.set(url, alt.trim() || "이미지");
  }

  return Array.from(found, ([url, name]) => ({ url, name }));
};

let uploadSeq = 0;

/**
 * 문서 본문 편집기.
 *
 * 공지 등록 모달과 같은 작성 | 미리보기 탭에, 넓은 화면에서는 좌우로 나란히 보며
 * 쓰는 보기를 더했다. 문서는 공지보다 훨씬 길어 탭을 오가며 확인하기 어렵다.
 * 미리보기는 마크다운을 그려 볼 뿐이고, 사이트 화면 그대로는 '사이트에서 보기'로 본다.
 *
 * 이미지는 버튼 · 붙여넣기 · 끌어다 놓기로 올리고, 올리는 동안 커서 자리에
 * 자리표시를 먼저 넣어 둔다. 업로드가 끝나기 전에 계속 써도 자리가 밀리지 않는다.
 * 올린 이미지는 아래 목록에도 남아, 자리표시를 지웠어도 링크를 복사하거나 다시 넣을 수 있다.
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
  const [tab, setTab] = useState<EditorTab>("WRITE");
  const [isSplit, setIsSplit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const { copy } = useCopyToClipboard();

  /*
    마지막으로 내보낸 본문. 업로드가 여러 개 거의 동시에 끝나면 앞의 교체가 아직
    다시 그려지지 않은 채로 다음 교체가 시작된다. 그때 입력칸(DOM)이나 렌더 때 받은
    `value` 를 읽으면 앞의 교체가 빠진 낡은 본문 위에 덮어써 자리표시가 남는다.
    그래서 바꿀 때마다 여기에 먼저 적고, 다음 교체는 언제나 여기서 읽는다.
  */
  const latestRef = useRef(value);

  /* 바깥에서 바뀐 값(.md 불러오기 · 언어 전환 · 저장 후 초기화)을 따라간다. */
  useLayoutEffect(() => {
    latestRef.current = value;
  }, [value]);

  const commit = (next: string) => {
    latestRef.current = next;
    onChange(next);
  };

  const patchUpload = (key: string, patch: Partial<UploadItem>) =>
    setUploads((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    const source = latestRef.current;
    const start = Math.min(textarea?.selectionStart ?? source.length, source.length);
    const end = Math.min(textarea?.selectionEnd ?? source.length, source.length);

    /* 이미지는 문단 하나로 두어야 미리보기에서 글 사이에 끼지 않는다. */
    const before = source.slice(0, start);
    const after = source.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const trail = after.startsWith("\n") ? "" : "\n";
    const inserted = `${lead}${text}${trail}`;

    commit(`${before}${inserted}${after}`);

    requestAnimationFrame(() => {
      const caret = start + inserted.length;
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
    });
  };

  /** 자리표시가 아직 있으면 바꾼다. 쓰는 사람이 지웠으면 본문은 건드리지 않는다. */
  const replaceInValue = (from: string, to: string) => {
    const source = latestRef.current;
    if (!source.includes(from)) return false;

    commit(source.replace(from, to));
    return true;
  };

  const uploadImages = async (files: File[]) => {
    const images = files.filter((file) => {
      if (!DOCS_IMAGE_MIME_TYPES.includes(file.type)) {
        showAppToast("warning", `${file.name}: JPG · PNG · WEBP 만 올릴 수 있습니다.`);
        return false;
      }

      if (file.size > DOCS_IMAGE_MAX_SIZE) {
        showAppToast("warning", `${file.name}: 5MB 이하 이미지만 올릴 수 있습니다.`);
        return false;
      }

      return true;
    });

    if (images.length === 0) return;

    const jobs = images.map((file) => {
      uploadSeq += 1;
      const key = `${Date.now()}-${uploadSeq}`;
      const name = altOf(file.name);

      return { file, key, name, placeholder: placeholderOf(`#${key}`, name) };
    });

    /* 미리보기 탭에서 올렸어도 자리표시가 어디에 들어갔는지 보이게 작성 탭으로 돌아간다. */
    setTab("WRITE");
    insertAtCursor(jobs.map((job) => job.placeholder).join("\n\n"));
    setUploads((current) => [
      ...jobs.map(({ key, name }) => ({ key, name, status: "UPLOADING" as const })),
      ...current,
    ]);

    await Promise.all(
      jobs.map(async ({ file, key, name, placeholder }) => {
        try {
          const { url } = await postDocsImage(file);
          replaceInValue(placeholder, markdownOf(name, url));
          patchUpload(key, { status: "DONE", url });
        } catch (error) {
          replaceInValue(placeholder, "");
          patchUpload(key, { status: "FAILED" });
          showErrorToast(error, `${file.name} 을(를) 올리지 못했습니다.`);
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

  /* ---------------------------------------------------------------- */
  /* 이미지 목록                                                          */
  /* ---------------------------------------------------------------- */

  const bodyImages = useMemo(() => imagesInBody(value), [value]);
  const bodyUrls = useMemo(
    () => new Set(bodyImages.map((image) => image.url)),
    [bodyImages],
  );

  const rows: ImageRow[] = useMemo(() => {
    const uploadedUrls = new Set(uploads.map((item) => item.url).filter(Boolean));

    return [
      ...uploads.map((item) => ({ ...item, isUpload: true })),
      ...bodyImages
        .filter((image) => !uploadedUrls.has(image.url))
        .map((image) => ({
          key: `body-${image.url}`,
          name: image.name,
          status: "DONE" as const,
          url: image.url,
          isUpload: false,
        })),
    ];
  }, [uploads, bodyImages]);

  const uploadingCount = uploads.filter((item) => item.status === "UPLOADING").length;

  const statusOf = (row: ImageRow): { tone: BadgeTone; label: string } => {
    if (row.status === "UPLOADING") return { tone: "info", label: "올리는 중" };
    if (row.status === "FAILED") return { tone: "danger", label: "실패" };
    if (row.url && bodyUrls.has(row.url)) return { tone: "success", label: "본문에 있음" };

    return { tone: "warning", label: "본문에 없음" };
  };

  const imageColumns: TableColumn<ImageRow>[] = [
    {
      key: "image",
      header: "이미지",
      width: "72px",
      render: (row) =>
        row.status === "UPLOADING" ? (
          <div className="flex size-12 items-center justify-center rounded-chip bg-subtle">
            <Spinner size={16} className="text-brand" />
          </div>
        ) : (
          <EntityImage src={row.url} alt={row.name} shape="chip" className="size-12" />
        ),
    },
    {
      key: "name",
      header: "이름",
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="max-w-80 truncate body-5 text-font-1">{row.name}</span>
          <span className="body-6 text-font-2">
            {row.isUpload ? "이번 편집에서 올림" : "저장된 본문"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const { tone, label } = statusOf(row);
        return <Badge tone={tone}>{label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => {
        const markdown =
          row.status === "DONE" && row.url ? markdownOf(row.name, row.url) : null;

        return (
          <div className="flex items-center justify-end gap-1">
            {markdown && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Copy size={14} />}
                onClick={() => copy(markdown, "마크다운 링크를 복사했습니다.")}
              >
                링크 복사
              </Button>
            )}
            {markdown && !disabled && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  setTab("WRITE");
                  insertAtCursor(markdown);
                }}
              >
                커서에 넣기
              </Button>
            )}
            {row.isUpload && row.status !== "UPLOADING" && (
              <IconButton
                size="sm"
                label="목록에서 빼기"
                icon={<Close size={14} />}
                onClick={() =>
                  setUploads((current) => current.filter((item) => item.key !== row.key))
                }
              />
            )}
          </div>
        );
      },
    },
  ];

  /* ---------------------------------------------------------------- */
  /* 화면                                                               */
  /* ---------------------------------------------------------------- */

  const showEditor = isSplit || tab === "WRITE";
  const showPreview = isSplit || tab === "PREVIEW";

  /* 미리보기 탭에서도 입력칸은 감추기만 한다. 커서 자리가 남아야 '커서에 넣기'가 제자리에 들어간다. */
  const editor = (
    <Textarea
      id={id}
      ref={textareaRef}
      rows={24}
      value={value}
      disabled={disabled}
      onChange={(event) => commit(event.target.value)}
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

  const preview = (
    <div className="min-h-120 overflow-y-auto rounded-field border border-border-main px-4 py-3 body-4 scrollbar-thin">
      {value.trim() ? (
        <MarkdownContent content={value} />
      ) : (
        <p className="body-5 text-font-2">본문을 입력하면 여기에서 미리 볼 수 있습니다.</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-2">
        {isSplit ? (
          <p className="py-2.5 body-5 text-font-2">작성 · 미리보기 나란히 보기</p>
        ) : (
          <Tabs items={EDITOR_TABS} value={tab} onChange={setTab} />
        )}

        <div className="flex items-center gap-1.5 pb-1">
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

          {/* 좁은 화면에서는 나란히 놓으면 둘 다 읽을 수 없어 버튼을 감춘다. */}
          <Button
            size="sm"
            variant={isSplit ? "secondary" : "ghost"}
            leftIcon={<Layers size={14} />}
            className="hidden xl:inline-flex"
            onClick={() => setIsSplit((current) => !current)}
          >
            {isSplit ? "탭으로 보기" : "나란히 보기"}
          </Button>
        </div>
      </div>

      <div className={cn(isSplit && "grid gap-3 xl:grid-cols-2")}>
        <div className={cn(!showEditor && "hidden")}>{editor}</div>
        {showPreview && preview}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2">
          <p className="body-5 font-medium text-font-1">
            업로드한 이미지
            <span className="ml-1.5 body-6 font-normal text-font-2">
              이번 편집에서 올린 이미지와 본문에 들어 있는 이미지입니다. 자리표시를 지웠어도
              여기서 링크를 다시 가져갈 수 있습니다.
            </span>
          </p>
          <div className="overflow-hidden rounded-field border border-border-main">
            <Table
              columns={imageColumns}
              rows={rows}
              getRowKey={(row) => row.key}
              minRows={0}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsMarkdownEditor;
