import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/ui/Badge";

interface StatusChipProps extends ComponentPropsWithoutRef<"span"> {
  /** 점 색. 없으면 점을 그리지 않는다(장르·성향처럼 좋고 나쁨이 없는 값). */
  tone?: BadgeTone;
}

const DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-font-disabled",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

/**
 * 상세 히어로 · 연관 목록 행의 상태 칩.
 *
 * `Badge`는 칩 전체를 물들여 표 안에서 한눈에 튀게 하는 용도다. 상세 화면은 칩이
 * 서너 개씩 나란히 서므로 전부 물들이면 색끼리 싸운다. 바탕은 회색으로 두고
 * **점 하나로만** 좋고 나쁨을 말한다.
 */
const StatusChip = ({ tone, className, children, ...props }: StatusChipProps) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-chip bg-subtle px-2 py-0.5 caption-1 whitespace-nowrap text-font-1",
      className,
    )}
    {...props}
  >
    {children}
    {tone && (
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", DOT_CLASS[tone])}
      />
    )}
  </span>
);

export default StatusChip;
