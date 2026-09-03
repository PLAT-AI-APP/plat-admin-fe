import Sparkline from "@/app/(admin)/_components/Sparkline";
import { cn } from "@/lib/utils";
import {
  USAGE_TONE_COLOR,
  USAGE_TONE_TEXT_CLASS,
  getUsageTone,
} from "../_constants/serverStatus";

interface MetricTileProps {
  label: string;
  /** 사용률 (%) */
  value: number;
  /** 절대량. 퍼센트 바로 아래 한 단계 낮은 계층으로 둔다. */
  amount: string;
  /** 사용률을 잴 수 없는 경우. 큰 숫자 자리를 대신 채운다. */
  fallbackValue?: string;
  /**
   * 최근 추이. 표본이 없는 구간(null)은 빼고 그린다.
   *
   * **주지 않으면 추이 대신 사용률 막대를 그린다.** 디스크처럼 시간별 표본을 쌓지 않는
   * 지표는 그릴 선이 없고, 빈 스파크라인은 "0이 이어졌다"로 읽힌다.
   */
  trend?: (number | null)[];
  /** 눌러서 아래 상세 카드로 이동한다. 지표가 많아 스크롤이 길어졌기 때문이다. */
  targetId?: string;
}

/**
 * 상단 요약 한 칸. 사용률 · 절대량 · 최근 추이를 같은 자리에서 읽게 한다.
 *
 * 사용률만 크게 적지 않는다. "90%"는 그 자체로 조치를 정해 주지 않고,
 * 남은 양과 올라가는 중인지가 함께 있어야 판단이 선다.
 */
const MetricTile = ({
  label,
  value,
  amount,
  fallbackValue,
  trend,
  targetId,
}: MetricTileProps) => {
  const tone = getUsageTone(value);
  const points = (trend ?? []).filter(
    (point): point is number => point !== null,
  );
  // 막대가 칸을 벗어나지 않게 잘라 낸다.
  const barWidth = Math.min(100, Math.max(0, value));

  const handleClick = () => {
    if (!targetId) return;

    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!targetId}
      className={cn(
        "flex flex-col gap-3 rounded-card border border-border-main bg-surface p-4 text-left shadow-card transition",
        targetId && "hover:border-border-strong hover:bg-surface-hover",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="body-5 text-font-2">{label}</span>

        <div className="flex min-w-0 flex-col items-end">
          <span
            className={cn(
              "title-1 font-bold tabular-nums",
              USAGE_TONE_TEXT_CLASS[tone],
            )}
          >
            {fallbackValue ?? `${value.toFixed(1)}%`}
          </span>

          <span className="body-4 font-medium text-font-2 tabular-nums">
            {amount}
          </span>
        </div>
      </div>

      {trend ? (
        <Sparkline
          values={points}
          label={`${label} 추이`}
          color={USAGE_TONE_COLOR[tone]}
          className="h-8 w-full"
        />
      ) : (
        // 스파크라인과 같은 높이를 차지해 칸끼리 키가 어긋나지 않게 한다.
        <div className="flex h-8 w-full items-center">
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
              style={{
                width: `${barWidth}%`,
                backgroundColor: USAGE_TONE_COLOR[tone],
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
};

export default MetricTile;
