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
 * 배경 이미지 → 왼쪽 어둡게 → 전경 이미지(오른쪽 끝, 높이 100%) → 뱃지·제목·설명·#태그 순으로 쌓는다.
 * 간격은 앱과 같다(뱃지 아래 8px, 나머지 4px). 글자 크기는 미리보기 폭에 맞춰 줄여 그린다. 앱(plat-fe 의 EventBanner)과 배치·뱃지 색이
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
  const backgroundImageUrl = buildImageUrl(
    backgroundImageFileId,
    "MAIN_BANNER",
  );
  const foregroundImageUrl = buildImageUrl(
    foregroundImageFileId,
    "MAIN_BANNER",
  );

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

      {/* 앱과 같은 막: 왼쪽 끝 #11141F 80% 에서 가운데 #000000 0% 로 옅어진다. 배경 위, 전경 아래. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#11141F]/80 to-black/0 to-50%" />

      {/* 전경은 배너 높이에 맞춰 만든다. 어둡게 깐 막 위, 오른쪽 끝에 높이 100% 로 얹는다. */}
      {foregroundImageUrl && (
        <Image
          src={toLoadableImageUrl(foregroundImageUrl)}
          alt=""
          width={2560}
          height={920}
          className="absolute top-0 right-0 h-full w-auto max-w-none"
          unoptimized
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex max-w-[60%] flex-col gap-1 pb-5 pl-12 text-preview-font">
        {badges.length > 0 && (
          <ul className="mb-1 flex flex-wrap gap-1">
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
