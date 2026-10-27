"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "@/icons";
import { cn, formatWithCommas } from "@/lib/utils";

interface PaginationProps {
  /** 1부터 시작하는 현재 페이지 */
  page: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number) => void;
  className?: string;
}

/** 한 번에 노출할 페이지 번호 개수 */
const PAGE_BLOCK_SIZE = 5;

const Pagination = ({
  page,
  totalCount,
  pageSize,
  onChange,
  className,
}: PaginationProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * 페이지를 옮기면 목록 머리로 올려 준다.
   *
   * 페이지네이션은 표 맨 아래에 있어서, 누르고 나면 새 페이지의 마지막 줄만 보인다.
   * 표 머리가 이미 보이는 짧은 목록에서는 움직이지 않는다.
   */
  const changePage = (nextPage: number) => {
    onChange(nextPage);

    const list = rootRef.current?.parentElement;
    let container = list?.parentElement ?? null;

    while (container && !/(auto|scroll)/.test(getComputedStyle(container).overflowY)) {
      container = container.parentElement;
    }

    if (!list || !container) return;

    const offset =
      list.getBoundingClientRect().top - container.getBoundingClientRect().top;

    if (offset < 0) {
      container.scrollBy({ top: offset - 16, behavior: "smooth" });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const blockIndex = Math.floor((page - 1) / PAGE_BLOCK_SIZE);
  const firstPage = blockIndex * PAGE_BLOCK_SIZE + 1;
  const lastPage = Math.min(firstPage + PAGE_BLOCK_SIZE - 1, totalPages);

  const pages = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, index) => firstPage + index,
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border-main px-5 py-3.5",
        className,
      )}
    >
      <p className="body-5 text-font-2 tabular-nums">
        총 {formatWithCommas(totalCount)}건
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
          className="flex size-8 items-center justify-center rounded-field text-font-2 transition hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => changePage(pageNumber)}
            className={cn(
              "flex size-8 items-center justify-center rounded-field body-5 tabular-nums transition",
              pageNumber === page
                ? "bg-surface-selected font-semibold text-brand"
                : "text-font-2 hover:bg-surface-hover hover:text-font-1",
            )}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          aria-label="다음 페이지"
          disabled={page >= totalPages}
          onClick={() => changePage(page + 1)}
          className="flex size-8 items-center justify-center rounded-field text-font-2 transition hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
