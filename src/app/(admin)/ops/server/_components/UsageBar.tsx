import { cn } from "@/lib/utils";
import {
  USAGE_TONE_COLOR,
  USAGE_TONE_TEXT_CLASS,
  getUsageTone,
} from "../_constants/serverStatus";

interface UsageBarProps {
  label: string;
  /** 사용률 (%) */
  value: number;
  description?: string;
  /** 큰 수치를 감춘다. 카드 안에서 여러 줄이 붙을 때 쓴다. */
  isCompact?: boolean;
}

/** 자원 사용률을 진행 바 하나로 보여준다. 임계치에 따라 막대와 수치 색이 함께 바뀐다. */
const UsageBar = ({ label, value, description, isCompact }: UsageBarProps) => {
  const tone = getUsageTone(value);
  // 값이 범위를 벗어나도 막대가 넘치지 않도록 잘라 낸다.
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="body-5 text-font-2">{label}</span>
        <span
          className={cn(
            "font-bold tabular-nums",
            isCompact ? "body-4" : "title-1",
            USAGE_TONE_TEXT_CLASS[tone],
          )}
        >
          {value.toFixed(1)}%
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
          className="h-full rounded-full transition-[width]"
          style={{ width: `${width}%`, backgroundColor: USAGE_TONE_COLOR[tone] }}
        />
      </div>

      {description && <p className="body-6 text-font-2">{description}</p>}
    </div>
  );
};

export default UsageBar;
