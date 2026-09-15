import { cn } from "@/lib/utils";

export interface HashtagLineItem {
  key: string;
  label: string;
  /** 운영에서 꺼 둔 태그. 앱에는 안 보이지만 매핑은 남아 있어 취소선으로 둔다. */
  isDisabled?: boolean;
  isAdult?: boolean;
}

interface HashtagLineProps {
  items: HashtagLineItem[];
  className?: string;
}

/** 히어로 · 연관 목록 행의 `#태그` 한 줄. 비어 있으면 아무것도 그리지 않는다. */
const HashtagLine = ({ items, className }: HashtagLineProps) => {
  if (items.length === 0) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap gap-x-2.5 gap-y-0.5 body-5 text-font-2",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex items-center gap-0.5",
            item.isDisabled && "text-font-disabled line-through",
          )}
          title={item.isDisabled ? "비활성 태그 · 앱에 노출되지 않습니다" : undefined}
        >
          #{item.label}
          {item.isAdult && <span className="caption-3 text-danger">19</span>}
        </span>
      ))}
    </p>
  );
};

export default HashtagLine;
