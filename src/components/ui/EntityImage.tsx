"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ImageIcon } from "@/icons";
import { cn } from "@/lib/utils";

/**
 * 세계관 · 캐릭터 · 에셋 이미지를 그리는 공통 컴포넌트.
 *
 * 이 컴포넌트가 있는 이유는 세 가지다.
 *
 * 1) **URL이 없을 때가 흔하다.** 관리자 서버는 FileId → URL을 만들지 못해
 *    이미지 URL이 비어 온다. 화면마다 `src`가 비었는지 확인하는 분기를
 *    따로 두면 어딘가는 반드시 빠지고, `next/image`는 빈 `src`에 예외를 던진다.
 * 2) **불러오기에 실패한다.** 파일이 지워졌거나 파기된 세계관이면 404가 난다.
 *    깨진 이미지 아이콘 대신 파일 ID가 적힌 자리표시를 보여 줘야 운영자가
 *    "이미지가 없는 것"과 "이미지를 못 불러온 것"을 구분할 수 있다.
 * 3) **같은 대상이 화면마다 다른 비율로 보였다.** 세계관 썸네일이 목록에서는
 *    정사각, 다른 화면에서는 16:10으로 잘려 같은 그림이 다르게 보였다.
 *    비율을 prop으로 고정해 화면 간 인상을 맞춘다.
 */

/** 이미지 자리의 가로세로 비율. 대상마다 정해 두고 화면에서 바꾸지 않는다. */
export type EntityImageRatio = "square" | "portrait" | "wide" | "banner";

/**
 * 모서리 모양.
 *
 * 인물(캐릭터)은 원형, 콘텐츠(세계관 · 에셋 · 배너)는 사각으로 둔다.
 * 한 줄에 섞여 나올 때 모양만으로 무엇인지 구분되는 편이 읽기 쉽다.
 */
export type EntityImageShape = "card" | "chip" | "circle";

const SHAPE_CLASS: Record<EntityImageShape, string> = {
  card: "rounded-card",
  chip: "rounded-chip",
  circle: "rounded-full",
};

const RATIO_CLASS: Record<EntityImageRatio, string> = {
  /** 세계관 · 캐릭터 대표 이미지 */
  square: "aspect-square",
  /** 캐릭터 일러스트처럼 세로가 긴 그림 */
  portrait: "aspect-[3/4]",
  /** 카드 헤더 */
  wide: "aspect-[16/10]",
  /** 메인 배너 */
  banner: "aspect-[1720/310]",
};

interface EntityImageProps {
  /** `resolveImageUrl()`의 결과를 그대로 넘긴다. 없으면 자리표시를 그린다. */
  src?: string;
  alt: string;
  ratio?: EntityImageRatio;
  /** 모서리 모양. 인물은 `circle`, 콘텐츠는 기본값 `card`. */
  shape?: EntityImageShape;
  /**
   * 자리표시에 함께 적을 파일 ID.
   *
   * 이미지를 못 본 채로 문의를 받는 일이 있어, 최소한 어떤 파일을 찾아야
   * 하는지는 화면에 남긴다.
   */
  fileId?: string | null;
  /** 자리표시에 아이콘 대신 넣을 것. 캐릭터 이름 첫 글자 등. */
  fallback?: ReactNode;
  /** 그림이 잘려도 자리를 꽉 채울지. 목록 썸네일은 `cover`가 낫다. */
  fit?: "cover" | "contain";
  className?: string;
  /** 이미지를 눌렀을 때. 지정하면 커서와 hover 표현이 붙는다. */
  onClick?: () => void;
}

const EntityImage = ({
  src,
  alt,
  ratio = "square",
  shape = "card",
  fileId,
  fallback,
  fit = "cover",
  className,
  onClick,
}: EntityImageProps) => {
  /*
    실패한 src 자체를 기억한다. 불리언으로 두면 src가 바뀔 때마다 effect로
    되돌려야 하는데, effect에서 setState를 하면 렌더가 한 번 더 돌면서
    새 이미지 자리에 이전 자리표시가 한 프레임 스친다.
  */
  const [erroredSrc, setErroredSrc] = useState<string>();

  const showPlaceholder = !src || erroredSrc === src;

  const frameClassName = cn(
    "relative overflow-hidden bg-subtle",
    RATIO_CLASS[ratio],
    SHAPE_CLASS[shape],
    onClick && "cursor-zoom-in transition hover:opacity-90",
    className,
  );

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          frameClassName,
          "flex flex-col items-center justify-center gap-1 text-font-disabled",
        )}
        // 자리표시는 눌러도 볼 것이 없다.
        aria-label={alt}
      >
        {fallback ?? <ImageIcon size={20} />}
        {fileId && (
          <span className="caption-3 px-1 text-center break-all">
            #{fileId}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={frameClassName} onClick={onClick}>
      <Image
        src={src}
        alt={alt}
        fill
        // 파일 서버가 이미 webp 변환본을 주므로 Next 최적화를 다시 태우지 않는다.
        unoptimized
        sizes="240px"
        className={fit === "cover" ? "object-cover" : "object-contain"}
        onError={() => setErroredSrc(src)}
      />
    </div>
  );
};

export default EntityImage;
