"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  label: string;
  value: T;
  /** 라벨 우측 개수 표기 */
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 스크린샷의 법적 고지 화면과 동일한 언더라인 탭 */
const Tabs = <T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) => {
  /** 좌우 방향키 · Home · End로 탭을 옮긴다. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    const last = items.length - 1;

    const nextIndex = {
      ArrowRight: index >= last ? 0 : index + 1,
      ArrowLeft: index <= 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];

    if (nextIndex === undefined || items.length === 0) return;

    event.preventDefault();
    onChange(items[nextIndex].value);
    event.currentTarget
      .querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-1 border-b border-border-main",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 body-4 transition",
              isActive
                ? "border-brand font-semibold text-brand"
                : "border-transparent text-font-2 hover:text-font-1",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 tabular-nums">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
