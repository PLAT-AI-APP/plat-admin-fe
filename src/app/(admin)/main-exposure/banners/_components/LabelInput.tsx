"use client";

import { useState, type KeyboardEvent } from "react";
import { Close } from "@/icons";
import { badgeColor } from "@/lib/badgeColor";
import { cn } from "@/lib/utils";

interface LabelInputProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** 넣을 수 있는 개수. 차면 입력 칸을 내린다. */
  maxCount: number;
  /** 한 개의 최대 글자 수. */
  maxLength: number;
  placeholder?: string;
  hasError?: boolean;
  /** 앞에 붙여 보여 줄 글자. 태그는 `#`. 저장 값에는 들어가지 않는다. */
  prefix?: string;
  /** 라벨에서 색을 만들어 칩에 입힌다(뱃지). */
  colored?: boolean;
  /** 눌러서 바로 넣는 후보. 이미 넣은 것은 빠진다. */
  suggestions?: string[];
}

/**
 * 라벨을 자유롭게 넣고 빼는 입력. Enter 나 쉼표로 넣고, 빈 칸에서 Backspace 로 마지막 것을 뺀다.
 * 정해진 목록이 없다 — 후보는 자주 쓰는 것을 한 번에 넣는 지름길일 뿐이다.
 */
const LabelInput = ({
  id,
  value,
  onChange,
  maxCount,
  maxLength,
  placeholder,
  hasError,
  prefix = "",
  colored,
  suggestions = [],
}: LabelInputProps) => {
  const [draft, setDraft] = useState("");
  const isFull = value.length >= maxCount;

  const add = (raw: string) => {
    // 태그에 붙여 넣은 # 은 뗀다 — 화면이 붙인다.
    const label = raw.trim().replace(/^#+/, "").trim();
    setDraft("");
    if (!label || isFull || value.includes(label)) return;
    onChange([...value, label]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중의 Enter 는 글자 확정이다.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((label) => !value.includes(label));

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-field border bg-surface px-3 py-1.5 transition",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-opacity",
          hasError ? "border-danger" : "border-border-main",
        )}
      >
        {value.map((label) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1 rounded-chip px-2 py-0.5 caption-2 font-medium",
              colored ? "text-white" : "bg-subtle text-font-1",
            )}
            style={colored ? { backgroundColor: badgeColor(label) } : undefined}
          >
            {prefix}
            {label}
            <button
              type="button"
              aria-label={`${label} 삭제`}
              onClick={() => onChange(value.filter((item) => item !== label))}
              className="opacity-70 transition hover:opacity-100"
            >
              <Close size={12} />
            </button>
          </span>
        ))}
        {!isFull && (
          <input
            id={id}
            value={draft}
            maxLength={maxLength}
            placeholder={value.length === 0 ? placeholder : undefined}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => add(draft)}
            className="min-w-24 flex-1 bg-transparent body-4 text-font-1 outline-none placeholder:text-font-disabled"
          />
        )}
      </div>

      {!isFull && remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => add(label)}
              className="rounded-chip border border-border-main px-2 py-0.5 caption-2 text-font-2 transition hover:border-brand hover:text-brand"
            >
              + {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabelInput;
