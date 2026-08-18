"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePendingCountsQuery } from "@/api/ops/getPendingCounts";
import { Bell } from "@/icons";
import { cn } from "@/lib/utils";
import type { PendingCounts } from "@/type/ops";

interface PendingEntry {
  key: keyof PendingCounts;
  label: string;
  href: string;
  hint: string;
}

/** 뱃지에 실을 항목. 사이드바의 `pendingKey`와 같은 값을 본다. */
const PENDING_ENTRIES: PendingEntry[] = [
  {
    key: "report",
    label: "미처리 신고",
    href: "/community/reports",
    hint: "접수 · 검토 중인 신고",
  },
  {
    key: "qna",
    label: "답변 대기 문의",
    href: "/communication/qna",
    hint: "아직 답변하지 않은 Q&A",
  },
  {
    key: "comment",
    label: "신고된 댓글",
    href: "/community/comments",
    hint: "신고가 들어왔지만 아직 노출 중",
  },
];

/**
 * 처리 대기 알림.
 *
 * **밀린 일이 있을 때만 눈에 띄어야 한다.** 항상 빨간 점이 켜져 있으면
 * 며칠 만에 아무도 보지 않게 된다. 0건이면 뱃지를 아예 그리지 않는다.
 */
const PendingBell = () => {
  const { data } = usePendingCountsQuery();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isOpen]);

  const total = data ? data.report + data.qna + data.comment : 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`처리 대기 ${total}건`}
        className="relative inline-flex size-9 items-center justify-center rounded-field text-font-2 transition hover:bg-surface-hover hover:text-font-1"
      >
        <Bell size={18} />

        {total > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-slide-up absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-card border border-border-main bg-surface shadow-popover">
          <p className="border-b border-border-main px-4 py-3 text-[13px] font-semibold text-font-1">
            처리 대기
          </p>

          <ul className="flex flex-col py-1">
            {PENDING_ENTRIES.map((entry) => {
              const count = data?.[entry.key] ?? 0;

              return (
                <li key={entry.key}>
                  <Link
                    href={entry.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-surface-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-font-1">
                        {entry.label}
                      </span>
                      <span className="block truncate text-[12px] text-font-2">
                        {entry.hint}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "shrink-0 text-[14px] font-semibold tabular-nums",
                        count > 0 ? "text-danger" : "text-font-disabled",
                      )}
                    >
                      {count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {total === 0 && (
            <p className="border-t border-border-main px-4 py-3 text-[12px] text-font-2">
              밀린 처리 건이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingBell;
