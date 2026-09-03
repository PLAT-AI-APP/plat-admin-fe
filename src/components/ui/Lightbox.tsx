"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Close, ExternalLink } from "@/icons";
import { useIsClient } from "@/hooks/useIsClient";
import IconButton from "./IconButton";

/**
 * 이미지를 원본 크기로 크게 보는 오버레이.
 *
 * 신고 대응과 저작권 · 선정성 검수는 **그림을 실제로 봐야** 판단할 수 있는데,
 * 목록의 80px 썸네일로는 불가능하다. 그리드에서 한 장을 눌러 크게 보고
 * 좌우로 넘기며 훑는 흐름을 위해 둔다.
 *
 * `Modal`을 쓰지 않는 이유는 목적이 다르기 때문이다. 모달은 폼과 확인을 위한
 * 것이라 흰 표면과 여백을 갖지만, 여기서는 그림 외의 것이 최대한 안 보여야 한다.
 */

export interface LightboxItem {
  id: string;
  url: string;
  title: string;
  /** 부제. 에셋의 상황 설명처럼 그림만으로 모르는 맥락을 적는다. */
  caption?: string | null;
}

interface LightboxProps {
  items: LightboxItem[];
  /** 열려 있는 항목의 인덱스. `null`이면 닫혀 있다. */
  index: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}

const Lightbox = ({ items, index, onChangeIndex, onClose }: LightboxProps) => {
  const isClient = useIsClient();
  const isOpen = index !== null && index >= 0 && index < items.length;

  const move = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;

      // 끝에서 반대편으로 이어 붙인다. 훑어보는 동안 멈칫할 일이 없다.
      onChangeIndex((index + delta + items.length) % items.length);
    },
    [index, items.length, onChangeIndex],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };

    window.addEventListener("keydown", onKeyDown);

    // 뒤 목록이 함께 스크롤되면 닫았을 때 보던 자리를 잃는다.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [isOpen, move, onClose]);

  if (!isClient || !isOpen) return null;

  const item = items[index];

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-overlay-strong backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 상단 바 — 제목과 닫기. 그림 위에 겹치지 않게 따로 띄운다. */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <p className="title-5 truncate text-overlay-font">{item.title}</p>
          {item.caption && (
            <p className="body-6 mt-0.5 truncate text-overlay-font/70">
              {item.caption}
            </p>
          )}
        </div>

        <span className="caption-2 shrink-0 text-overlay-font/70 tabular-nums">
          {index + 1} / {items.length}
        </span>

        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          // 원본 해상도 확인과 저장은 새 탭에서 한다.
          className="shrink-0 rounded-field p-2 text-overlay-font/70 transition hover:bg-overlay-font/10 hover:text-overlay-font"
          aria-label="원본 이미지 새 탭에서 열기"
        >
          <ExternalLink size={18} />
        </a>

        <IconButton
          label="닫기"
          icon={<Close size={18} />}
          onClick={onClose}
          className="shrink-0 text-overlay-font/70 hover:bg-overlay-font/10 hover:text-overlay-font"
        />
      </div>

      {/* 그림 — 배경을 누르면 닫히므로 그림 자체는 이벤트를 막는다. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-16 pb-8">
        {items.length > 1 && (
          <IconButton
            label="이전 이미지"
            icon={<ChevronLeft size={22} />}
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            className="absolute left-4 text-overlay-font/70 hover:bg-overlay-font/10 hover:text-overlay-font"
          />
        )}

        <div
          className="relative h-full w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={item.url}
            alt={item.title}
            fill
            unoptimized
            sizes="90vw"
            className="object-contain"
          />
        </div>

        {items.length > 1 && (
          <IconButton
            label="다음 이미지"
            icon={<ChevronRight size={22} />}
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
            className="absolute right-4 text-overlay-font/70 hover:bg-overlay-font/10 hover:text-overlay-font"
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Lightbox;
