"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toKst } from "@/lib/dayjs";
import type { ContentReviewMonitorRange, ContentReviewSeriesPoint } from "@/type/contentReview";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";

/** 차트 색은 CSS 변수로만 지정해 테마 전환을 그대로 따르게 한다. */
const AXIS_COLOR = "var(--font-2)";
const GRID_COLOR = "var(--border)";

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-popover)",
  fontSize: 13,
} as const;

/** 아래에서부터 쌓는 순서. 범례와 막대가 같은 목록을 본다. */
const SERIES = [
  { key: "approved", label: "승인", color: "var(--brand)" },
  { key: "manual", label: "관리자 이관", color: "var(--warning)" },
  { key: "rejected", label: "반려", color: "var(--danger)" },
  { key: "failed", label: "시도 실패", color: "var(--font-3-disabled)" },
] as const;

const SERIES_LABEL: Record<string, string> = Object.fromEntries(
  SERIES.map((series) => [series.key, series.label]),
);

const RANGE_META: Record<ContentReviewMonitorRange, { label: string; bucket: string; tick: string }> = {
  "1h": { label: "1시간", bucket: "5분", tick: "HH:mm" },
  "6h": { label: "6시간", bucket: "15분", tick: "HH:mm" },
  "24h": { label: "24시간", bucket: "1시간", tick: "HH시" },
};

const RANGE_TABS = (Object.keys(RANGE_META) as ContentReviewMonitorRange[]).map((range) => ({
  label: RANGE_META[range].label,
  value: range,
}));

interface ThroughputChartProps {
  series: ContentReviewSeriesPoint[];
  range: ContentReviewMonitorRange;
  onRangeChange: (range: ContentReviewMonitorRange) => void;
  isLoading: boolean;
}

const ThroughputChart = ({ series, range, onRangeChange, isLoading }: ThroughputChartProps) => {
  const sums = SERIES.map((each) => ({
    ...each,
    total: series.reduce((sum, point) => sum + point[each.key], 0),
  }));

  return (
    <Card
      className="min-w-0 flex-[1_1_420px]"
      title="처리량"
      description={`최근 ${RANGE_META[range].label} · ${RANGE_META[range].bucket} 단위 · 막대에 올리면 건수`}
    >
      <Tabs items={RANGE_TABS} value={range} onChange={onRangeChange} />
      {isLoading ? (
        <Skeleton className="mt-5 h-[200px] w-full" />
      ) : (
        <div className="mt-5 h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis
                dataKey="bucketStart"
                tickFormatter={(value: string) => toKst(value).format(RANGE_META[range].tick)}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={{ color: "var(--font-2)" }}
                itemStyle={{ color: "var(--font-1)" }}
                cursor={{ fill: "var(--bg-surface-hover)" }}
                labelFormatter={(value) => toKst(String(value)).format("MM.DD HH:mm")}
                formatter={(value, name) => [`${Number(value)}건`, SERIES_LABEL[String(name)] ?? String(name)]}
              />
              {SERIES.map((each) => (
                <Bar
                  key={each.key}
                  dataKey={each.key}
                  stackId="review"
                  fill={each.color}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 body-6 text-font-2">
        {sums.map((each) => (
          <span key={each.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ backgroundColor: each.color }} />
            {each.label} <span className="tabular-nums">{each.total}</span>
          </span>
        ))}
      </div>
    </Card>
  );
};

export default ThroughputChart;
