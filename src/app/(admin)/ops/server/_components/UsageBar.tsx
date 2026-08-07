import { cn } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  /** 사용률 (%) */
  value: number;
  description?: string;
}

/** 임계치. 80% 이상은 주의, 90% 이상은 위험으로 본다. */
const WARNING_THRESHOLD = 80;
const DANGER_THRESHOLD = 90;

/** 임계치에 따라 막대와 수치 색을 함께 바꾼다. */
const getUsageClass = (value: number) => {
  if (value >= DANGER_THRESHOLD) return { bar: "bg-danger", text: "text-danger" };
  if (value >= WARNING_THRESHOLD)
    return { bar: "bg-warning", text: "text-warning" };

  return { bar: "bg-brand", text: "text-font-0" };
};

/** 자원 사용률을 진행 바 하나로 보여준다. */
const UsageBar = ({ label, value, description }: UsageBarProps) => {
  const { bar, text } = getUsageClass(value);
  // 값이 범위를 벗어나도 막대가 넘치지 않도록 잘라 낸다.
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-font-2">{label}</span>
        <span className={cn("text-[20px] font-bold tabular-nums", text)}>
          {value}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-subtle"
      >
        <div
          className={cn("h-full rounded-full transition", bar)}
          style={{ width: `${width}%` }}
        />
      </div>

      {description && (
        <p className="text-[12px] text-font-2">{description}</p>
      )}
    </div>
  );
};

export default UsageBar;
