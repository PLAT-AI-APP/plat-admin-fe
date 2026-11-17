"use client";

import Image from "next/image";
import { BANNER_ASPECT_RATIO, BANNER_BADGES } from "@/constants/mainExposure";
import { ChevronLeft, ChevronRight, ImageIcon } from "@/icons";
import { buildImageUrl, toLoadableImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import type { BannerBadge } from "@/type/mainExposure";

interface BannerPreviewProps {
  /** 배경 이미지 파일 ID. 비어 있으면 자리표시를 그린다. */
  backgroundImageFileId?: string;
  /** 배경 위 오른쪽에 얹어 강조하는 이미지(투명 배경) 파일 ID. 없으면 배경만 그린다. */
  foregroundImageFileId?: string;
  title?: string;
  description?: string;
  badges?: BannerBadge[];
  tags?: string[];
  /** 캐러셀 순번 표시 (ex: 1/5) */
  index?: number;
  totalCount?: number;
  className?: string;
}

/**
 * 실제 앱 메인 최상단 캐러셀과 같은 비율·배치의 미리보기(이벤트형 템플릿).
 *
 * 배경 이미지 → 왼쪽 어둡게 → 전경 이미지(오른쪽 아래 기준, 높이 꽉 채움) → 뱃지·제목·설명·#태그 순으로 쌓는다. 앱(plat-fe 의 EventBanner)과 배치·뱃지 색이
 * 같아야 한다. 좌우 화살표와 순번은 캐러셀 자체의 표시이고 조작 기능은 없다.
 */
const BannerPreview = ({
  backgroundImageFileId,
  foregroundImageFileId,
  title,
  description,
  badges = [],
  tags = [],
  index,
  totalCount,
  className,
}: BannerPreviewProps) => {
  const backgroundImageUrl = buildImageUrl(backgroundImageFileId, "MAIN_BANNER");
  const foregroundImageUrl = buildImageUrl(foregroundImageFileId, "MAIN_BANNER");

  return (
    <div
      style={{ aspectRatio: BANNER_ASPECT_RATIO }}
      className={cn(
        "relative w-full overflow-hidden rounded-card bg-preview-bg select-none",
        className,
      )}
    >
      {backgroundImageUrl ? (
        <Image
          src={toLoadableImageUrl(backgroundImageUrl)}
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

      {/* 글자가 놓이는 왼쪽 아래만 어둡게 깐다. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-preview-scrim via-preview-scrim/40 via-55% to-transparent" />

      {/* 전경은 어둡게 깐 막 위에 얹어 강조한다. 비율이 달라도 오른쪽 아래에 붙는다. */}
      {foregroundImageUrl && (
        <Image
          src={toLoadableImageUrl(foregroundImageUrl)}
          alt=""
          fill
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-contain object-right-bottom"
          unoptimized
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex max-w-[60%] flex-col gap-1.5 pb-5 pl-12 text-preview-font">
        {badges.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full px-2 py-0.5 caption-3 font-semibold"
                style={{ backgroundColor: BANNER_BADGES[badge].color }}
              >
                {BANNER_BADGES[badge].label}
              </li>
            ))}
          </ul>
        )}
        <p className="line-clamp-2 text-2xl leading-tight font-bold break-keep">
          {title || "제목"}
        </p>
        {description && (
          <p className="line-clamp-2 body-5 break-keep text-preview-font/85">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-x-1.5 caption-2 text-preview-font/65">
            {tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}
      </div>

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
