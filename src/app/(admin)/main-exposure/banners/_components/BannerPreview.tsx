"use client";

import Image from "next/image";
import { BANNER_ASPECT_RATIO } from "@/constants/mainExposure";
import { ChevronLeft, ChevronRight } from "@/icons";
import { cn } from "@/lib/utils";

interface BannerPreviewProps {
  imageUrl: string;
  title: string;
  description: string;
  tags: string[];
  /** 캐러셀 순번 표시 (ex: 1/5) */
  index?: number;
  totalCount?: number;
  className?: string;
}

/**
 * 실제 앱 메인 최상단 캐러셀과 동일한 비율·레이아웃의 미리보기.
 * 운영자가 저장 전에 결과물을 확인하기 위한 용도이며 조작 기능은 없다.
 */
const BannerPreview = ({
  imageUrl,
  title,
  description,
  tags,
  index,
  totalCount,
  className,
}: BannerPreviewProps) => {
  return (
    <div
      style={{ aspectRatio: BANNER_ASPECT_RATIO }}
      className={cn(
        "relative w-full overflow-hidden rounded-card bg-preview-bg select-none",
        className,
      )}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover"
          unoptimized
        />
      )}

      {/* 좌측 텍스트 가독성을 위한 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

      <div className="absolute inset-y-0 left-0 flex w-[52%] flex-col justify-center gap-2 pl-[6%]">
        {index !== undefined && totalCount !== undefined && (
          <span className="w-fit rounded-chip bg-preview-scrim px-1.5 py-0.5 caption-3 font-medium text-preview-font/90 tabular-nums">
            {index}/{totalCount}
          </span>
        )}

        <p className="truncate text-[clamp(16px,1.6vw,26px)] font-bold text-preview-font">
          {title || "제목을 입력해 주세요"}
        </p>

        <p className="line-clamp-2 text-[clamp(10px,0.85vw,14px)] leading-relaxed text-preview-font/70">
          {description || "설명이 여기에 노출됩니다."}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-chip bg-preview-accent/85 px-1.5 py-0.5 text-[clamp(9px,0.7vw,12px)] font-medium text-preview-font"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

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
