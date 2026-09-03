import { cn } from "@/lib/utils";
import {
  DONUT_SIZE,
  USAGE_TONE_COLOR,
  USAGE_TONE_TEXT_CLASS,
  getUsageTone,
} from "../_constants/serverStatus";

interface DonutGaugeProps {
  /** 사용률 (%) */
  value: number;
  size?: number;
  /** 링 두께. 기본값은 지름 비례라 구성 도넛과 굵기가 맞는다. */
  thickness?: number;
  /** 게이지 한가운데 글자. 없으면 사용률을 적는다. */
  caption?: string;
  className?: string;
}

/**
 * 사용률 하나를 원형으로 보여 준다.
 *
 * 막대와 달리 카드 안에서 자리를 적게 먹으면서도 "얼마나 남았는지"가 먼저 보인다.
 */
const DonutGauge = ({
  value,
  size = DONUT_SIZE,
  thickness,
  caption,
  className,
}: DonutGaugeProps) => {
  const tone = getUsageTone(value);
  const stroke = thickness ?? Math.round(size * 0.12);
  // 작게 그린 게이지는 가운데 글자도 같이 줄여야 링 안에 들어간다.
  const isCompact = size < 140;
  // 값이 범위를 벗어나도 호가 한 바퀴를 넘지 않도록 잘라 낸다.
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`사용률 ${value}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={USAGE_TONE_COLOR[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-bold tabular-nums",
            isCompact ? "body-2" : "title-2",
            USAGE_TONE_TEXT_CLASS[tone],
          )}
        >
          {value.toFixed(1)}
          <span className={cn("font-medium", isCompact ? "body-6" : "body-5")}>
            %
          </span>
        </span>

        {caption && <span className="body-6 text-font-2">{caption}</span>}
      </div>
    </div>
  );
};

export default DonutGauge;
