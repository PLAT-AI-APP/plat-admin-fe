"use client";

import { BANNER_BADGES } from "@/constants/mainExposure";
import { cn } from "@/lib/utils";
import { BANNER_BADGE_CODES, type BannerBadge } from "@/type/mainExposure";

interface BadgePickerProps {
  value: BannerBadge[];
  onChange: (value: BannerBadge[]) => void;
  /** 고를 수 있는 개수. 차면 고르지 않은 것은 누를 수 없다. */
  maxCount: number;
}

/** 정해진 뱃지 중에서 고른다. 누른 순서가 앱에 나열되는 순서다. */
const BadgePicker = ({ value, onChange, maxCount }: BadgePickerProps) => {
  const isFull = value.length >= maxCount;

  return (
    <div className="flex flex-wrap gap-1.5">
      {BANNER_BADGE_CODES.map((code) => {
        const selected = value.includes(code);
        const { label, color } = BANNER_BADGES[code];
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            disabled={!selected && isFull}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((item) => item !== code)
                  : [...value, code],
              )
            }
            className={cn(
              "rounded-chip border px-2 py-0.5 caption-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-transparent text-white"
                : "border-border-main text-font-2 hover:border-brand hover:text-brand",
            )}
            style={selected ? { backgroundColor: color } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default BadgePicker;
