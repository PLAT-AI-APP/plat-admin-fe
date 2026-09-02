import { ArrowDown, ArrowUp } from "@/icons";
import { cn, formatDelta } from "@/lib/utils";
import type { DashboardMetric, DashboardMetricKey } from "@/type/dashboard";
import Card from "@/components/ui/Card";
import Sparkline from "./Sparkline";
import {
  formatDeltaAmount,
  formatMetricValue,
  resolveDelta,
} from "./dashboardMetric";

interface MetricCardProps {
  metric: DashboardMetric;
  /** 카드 안 추이선에 그릴 값들. 아래 차트와 같은 계열의 뒷부분이다. */
  spark: number[];
  /** 추이 차트가 지금 이 지표를 그리고 있는지 */
  isActive: boolean;
  onSelect: (key: DashboardMetricKey) => void;
  /** 추이선 구간 라벨 (ex: 최근 14일) */
  sparkLabel: string;
}

/** 증감 방향별 색. 0%는 색을 입히지 않는다 — 좋고 나쁨이 없다. */
const DELTA_CLASS = {
  UP: "text-success",
  DOWN: "text-danger",
  FLAT: "text-font-2",
} as const;

/**
 * 지표 카드.
 *
 * 카드는 누를 수 있고, 누르면 아래 추이 차트가 이 지표로 바뀐다. 카드에 적힌
 * 값은 그 계열의 마지막 점이라 두 영역이 같은 숫자를 말한다.
 */
const MetricCard = ({
  metric,
  spark,
  isActive,
  onSelect,
  sparkLabel,
}: MetricCardProps) => {
  const direction = resolveDelta(metric.deltaRate);
  const diff = metric.value - metric.previousValue;

  return (
    <Card
      bodyClassName="p-0"
      className={cn(
        "transition",
        isActive
          ? "border-brand ring-1 ring-brand"
          : "hover:border-border-strong",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(metric.key)}
        aria-pressed={isActive}
        className="w-full cursor-pointer rounded-card p-4 text-left"
      >
        <p className="body-5 text-font-2">{metric.label}</p>

        <p className="mt-2 truncate heading-1 font-bold text-font-0 tabular-nums">
          {formatMetricValue(metric.value, metric)}
        </p>

        <div className="mt-2 flex items-center gap-1">
          {direction === "UP" && <ArrowUp size={14} className="text-success" />}
          {direction === "DOWN" && (
            <ArrowDown size={14} className="text-danger" />
          )}

          <span
            className={cn(
              "body-5 font-medium tabular-nums",
              DELTA_CLASS[direction],
            )}
          >
            {formatDelta(metric.deltaRate)}
          </span>

          <span className="body-6 text-font-2">전일 대비</span>
        </div>

        {/*
          증감률만 적으면 모수를 알 수 없다. "+40%"가 5명이 7명이 된 것인지
          5,000명이 7,000명이 된 것인지에 따라 할 일이 달라지므로 전일 값과
          증감량을 함께 적는다.
        */}
        <p className="mt-1 body-6 whitespace-nowrap text-font-2 tabular-nums">
          전일 {formatMetricValue(metric.previousValue, metric)}
          <span className="mx-1 text-font-disabled">·</span>
          <span className={DELTA_CLASS[direction]}>
            {formatDeltaAmount(diff, metric)}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="shrink-0 body-6 text-font-disabled">
            {sparkLabel}
          </span>

          <Sparkline
            values={spark}
            isActive={isActive}
            label={`${metric.label} ${sparkLabel} 추이`}
            className="h-7 min-w-0 flex-1"
          />
        </div>
      </button>
    </Card>
  );
};

export default MetricCard;
