import { ArrowDown, ArrowUp } from "@/icons";
import {
  cn,
  formatCredit,
  formatCurrency,
  formatDelta,
  formatWithCommas,
} from "@/lib/utils";
import type { DashboardMetric } from "@/type/dashboard";
import Card from "@/components/ui/Card";

interface MetricCardProps {
  metric: DashboardMetric;
}

/** 단위에 맞춰 지표 값을 표기한다. */
const formatMetricValue = ({ value, unit }: DashboardMetric): string => {
  if (unit === "CURRENCY") return formatCurrency(value);
  if (unit === "CREDIT") return formatCredit(value);

  return formatWithCommas(value);
};

const MetricCard = ({ metric }: MetricCardProps) => {
  const isIncreased = metric.deltaRate > 0;
  const isDecreased = metric.deltaRate < 0;

  return (
    <Card bodyClassName="p-4">
      <p className="text-[13px] text-font-2">{metric.label}</p>

      <p className="mt-2 truncate text-[26px] font-bold text-font-0 tabular-nums">
        {formatMetricValue(metric)}
      </p>

      <div className="mt-2 flex items-center gap-1">
        {isIncreased && <ArrowUp size={14} className="text-success" />}
        {isDecreased && <ArrowDown size={14} className="text-danger" />}

        <span
          className={cn(
            "text-[13px] font-medium tabular-nums",
            isIncreased && "text-success",
            isDecreased && "text-danger",
            !isIncreased && !isDecreased && "text-font-2",
          )}
        >
          {formatDelta(metric.deltaRate)}
        </span>

        <span className="text-[12px] text-font-2">전일 대비</span>
      </div>
    </Card>
  );
};

export default MetricCard;
