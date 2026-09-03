"use client";

import Image from "next/image";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { ChevronLeft, ChevronRight, ImageIcon } from "@/icons";
import { buildImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

interface BannerPreviewProps {
  /** 배너 이미지 파일 ID. 비어 있으면 자리표시를 그린다. */
  imageFileId?: string;
  /** 캐러셀 순번 표시 (ex: 1/5) */
  index?: number;
  totalCount?: number;
  className?: string;
}

/**
 * 실제 앱 메인 최상단 캐러셀과 동일한 비율의 미리보기.
 *
 * **앱은 올린 이미지를 그대로 깐다.** 제목·설명·태그를 덧그리던 템플릿은
 * 걷어냈으므로 여기서도 아무것도 얹지 않는다. 좌우 화살표와 순번만 캐러셀
 * 자체의 표시라 남겨 둔다. 조작 기능은 없다.
 */
const BannerPreview = ({
  imageFileId,
  index,
  totalCount,
  className,
}: BannerPreviewProps) => {
  const imageUrl = buildImageUrl(imageFileId, "MAIN_BANNER");

  return (
    <div
      style={{ aspectRatio: BANNER_ASPECT_RATIO }}
      className={cn(
        "relative w-full overflow-hidden rounded-card bg-preview-bg select-none",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-preview-font/50">
          <ImageIcon size={28} />
          <p className="caption-3">이미지를 올리면 여기에 보입니다.</p>
        </div>
      )}

      {index !== undefined && totalCount !== undefined && (
        <span className="absolute right-3 bottom-3 rounded-chip bg-preview-scrim px-1.5 py-0.5 caption-3 font-medium text-preview-font/90 tabular-nums">
          {index}/{totalCount}
        </span>
      )}

      {/* 캐러셀 좌우 이동 아이콘. 미리보기 전용이라 동작하지 않는다. */}
      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-preview-font/50">
        <ChevronLeft size={22} />
      </span>
      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-preview-font/50">
        <ChevronRight size={22} />
      </span>
    </div>
  );
};

export default BannerPreview;
