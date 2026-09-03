"use client";

import Image from "next/image";
import { DragEvent, useId, useRef, useState } from "react";
import {
  useFileUploadMutation,
  type FileUploadType,
} from "@/api/file/postFileUpload";
import { ImageIcon, Trash, Upload } from "@/icons";
import { buildImageUrl } from "@/lib/imageUrl";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Button from "./Button";
import Spinner from "./Spinner";

interface ImageUploadFieldProps {
  /** 업로드 완료된 이미지의 파일 ID. 비어 있으면 빈 상태를 보여준다. */
  value: string;
  onChange: (fileId: string) => void;
  /** 서버가 용도별로 보관 정책을 다르게 가져가므로 반드시 지정한다. */
  fileType: FileUploadType;
  /** 미리보기 비율. 배너처럼 가로로 긴 이미지는 직접 지정한다. */
  aspectRatio?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

/** 업로드 허용 확장자 */
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 업로드 최대 용량 (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 이미지 업로드 필드.
 *
 * 파일을 고르면 즉시 업로드해 **파일 ID**를 받아 onChange로 넘긴다. 서버가
 * 저장 API에서 받는 값이 파일 ID라 폼도 같은 값을 들고 있어야 한다.
 *
 * 미리보기는 그 파일 ID로 서비스 서버의 공개 이미지 경로를 조립해 그린다 —
 * 관리자 서버는 이미지를 서빙하지 않아 업로드 응답에 URL이 없다.
 */
const ImageUploadField = ({
  value,
  onChange,
  fileType,
  aspectRatio = "16 / 9",
  hasError = false,
  disabled = false,
  className,
}: ImageUploadFieldProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { mutateAsync: uploadFile, isPending } = useFileUploadMutation();

  const isBusy = isPending || disabled;

  /** 확장자·용량을 미리 걸러 불필요한 업로드 요청을 막는다. */
  const validate = (file: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      showAppToast("warning", "JPG, PNG, WEBP 파일만 업로드할 수 있습니다.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showAppToast("warning", "10MB 이하 이미지만 업로드할 수 있습니다.");
      return false;
    }

    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validate(file)) return;

    try {
      const uploaded = await uploadFile({ fileType, file });
      onChange(uploaded.fileId);
      showAppToast("success", "이미지를 업로드했습니다.");
    } catch (error) {
      showErrorToast(error, "이미지 업로드에 실패했습니다.");
    }
  };

  const handleSelect = (fileList: FileList | null) => {
    const [file] = Array.from(fileList ?? []);
    if (file) handleUpload(file);

    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다.
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isBusy) return;

    handleSelect(event.dataTransfer.files);
  };

  const handleRemove = () => onChange("");

  /* 업로드 직후에도 서버에 파일이 이미 있어 같은 URL로 바로 보인다. */
  const previewUrl = buildImageUrl(value, fileType);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(",")}
        disabled={isBusy}
        onChange={(event) => handleSelect(event.target.files)}
        className="hidden"
      />

      {previewUrl ? (
        <div
          style={{ aspectRatio }}
          className="relative w-full overflow-hidden rounded-field border border-border-main bg-subtle"
        >
          <Image
            src={previewUrl}
            alt="업로드한 이미지 미리보기"
            fill
            sizes="(max-width: 960px) 100vw, 960px"
            className="object-cover"
            unoptimized
          />

          {/* 업로드 후에도 바로 교체·삭제할 수 있게 이미지 위에 액션을 둔다. */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Upload size={14} />}
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              isLoading={isPending}
            >
              변경
            </Button>

            <Button
              size="sm"
              variant="danger"
              leftIcon={<Trash size={14} />}
              onClick={handleRemove}
              disabled={isBusy}
            >
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isBusy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{ aspectRatio }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-field border border-dashed transition",
            "hover:border-brand hover:bg-brand-opacity-3",
            isDragging && "border-brand bg-brand-opacity-3",
            hasError ? "border-danger" : "border-border-strong",
            isBusy && "pointer-events-none opacity-60",
          )}
        >
          {isPending ? (
            <>
              <Spinner size={22} className="text-brand" />
              <p className="body-5 text-font-2">업로드 중…</p>
            </>
          ) : (
            <>
              <ImageIcon size={28} className="text-font-disabled" />
              <p className="body-5 font-medium text-font-1">
                클릭하거나 이미지를 끌어다 놓으세요
              </p>
              <p className="body-6 text-font-2">
                JPG · PNG · WEBP / 10MB 이하
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
};

export default ImageUploadField;
