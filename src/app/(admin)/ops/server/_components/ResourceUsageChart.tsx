"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  METRIC_RANGES,
  METRIC_RANGE_BUCKET_LABEL,
  METRIC_RANGE_LABEL,
  type MetricRange,
  type ServerMetricPoint,
} from "@/api/ops/getServerMetrics";
import dayjs from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";

interface ResourceUsageChartProps {
  metrics: ServerMetricPoint[];
  range: MetricRange;
  onRangeChange: (range: MetricRange) => void;
  isLoading: boolean;
}

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

/**
 * 그리는 계열. 범례와 선이 같은 목록을 보게 해서 색과 라벨이 어긋나지 않게 한다.
 *
 * 힙을 메모리와 나란히 둔다. 머신 메모리에 여유가 있어도 힙이 차면 GC가 돌기
 * 시작하고, 응답이 느려진 원인은 그쪽인 경우가 많다.
 */
const SERIES = [
  { key: "cpuUsage", label: "CPU", color: "var(--brand)" },
  { key: "memoryUsage", label: "메모리", color: "var(--info)" },
  { key: "heapUsage", label: "JVM 힙", color: "#8b5cf6" },
] as const satisfies readonly {
  key: keyof ServerMetricPoint;
  label: string;
  color: string;
}[];

type SeriesKey = (typeof SERIES)[number]["key"];

const SERIES_LABEL: Record<string, string> = Object.fromEntries(
  SERIES.map((series) => [series.key, series.label]),
);

const RANGE_TABS = METRIC_RANGES.map((range) => ({
  label: METRIC_RANGE_LABEL[range],
  value: range,
}));

/** 구간이 하루를 넘으면 시각만으로는 어느 날인지 알 수 없다. */
const tickFormat = (range: MetricRange) =>
  range === "7d" ? "MM.DD" : "HH:mm";

const ResourceUsageChart = ({
  metrics,
  range,
  onRangeChange,
  isLoading,
}: ResourceUsageChartProps) => {
  const [hidden, setHidden] = useState<SeriesKey[]>([]);

  /**
   * 7일 구간의 가로축 눈금. 1시간 간격 168점을 차트가 알아서 고르면 눈금이 아무 시각에나 걸려
   * 같은 날짜가 두 번씩 찍힌다(08.28 · 08.28). 자정만 눈금으로 줘서 하루에 한 번 나오게 한다.
   */
  const dayTicks = useMemo(
    () =>
      range === "7d"
        ? metrics
            .map((point) => point.capturedAt)
            .filter((capturedAt) => dayjs(capturedAt).hour() === 0)
        : undefined,
    [metrics, range],
  );

  const toggleSeries = (key: SeriesKey) =>
    setHidden((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key],
    );

  const hasTraffic = metrics.some(
    (point) => point.requestCount > 0 || point.errorCount > 0,
  );

  return (
    <Card
      id="server-trend"
      title="자원 사용률 추이"
      description={`${METRIC_RANGE_LABEL[range]} · ${METRIC_RANGE_BUCKET_LABEL[range]} 단위 · 선이 끊긴 구간은 표본이 없는 시간입니다`}
      action={
        <div className="flex items-center gap-3">
          {SERIES.map((series) => {
            const isHidden = hidden.includes(series.key);

            return (
              <button
                key={series.key}
                type="button"
                onClick={() => toggleSeries(series.key)}
                className={cn(
                  "flex items-center gap-1.5 transition",
                  isHidden && "opacity-40",
                )}
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span className="body-5 text-font-2">{series.label}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <Tabs items={RANGE_TABS} value={range} onChange={onRangeChange} />

      {isLoading ? (
        <Skeleton className="mt-5 h-[220px] w-full" />
      ) : (
        <div className="mt-5 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={GRID_COLOR}
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="capturedAt"
                ticks={dayTicks}
                tickFormatter={(value: string) =>
                  dayjs(value).format(tickFormat(range))
                }
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
                minTickGap={24}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(value: number) => `${value}%`}
              />

              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={{ color: "var(--font-2)" }}
                itemStyle={{ color: "var(--font-1)" }}
                cursor={{ stroke: GRID_COLOR }}
                labelFormatter={(value) =>
                  dayjs(String(value)).format("MM.DD HH:mm")
                }
                formatter={(value, name) => [
                  value === null || value === undefined
                    ? "기록 없음"
                    : `${Number(value)}%`,
                  SERIES_LABEL[String(name)] ?? String(name),
                ]}
              />

              {/*
                connectNulls를 켜지 않는다. 표본이 없는 시간대(대개 배포로 서버가
                내려가 있던 구간)를 앞뒤 점으로 이어 버리면, 없었던 값을 그린 선이
                측정한 선과 구분되지 않는다. 끊어서 "여기는 모른다"를 보여 준다.
              */}
              {SERIES.filter((series) => !hidden.includes(series.key)).map(
                (series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasTraffic && (
        <div className="mt-6 border-t border-border-main pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="body-5 font-medium text-font-1">
              요청 수 · 오류 수
            </span>
            <span className="body-6 text-font-2">
              사용률이 튄 시각에 요청도 함께 튀었는지 겹쳐 봅니다
            </span>
          </div>

          <div className="mt-3 h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={GRID_COLOR}
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="capturedAt"
                  ticks={dayTicks}
                  tickFormatter={(value: string) =>
                    dayjs(value).format(tickFormat(range))
                  }
                  tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: GRID_COLOR }}
                  minTickGap={24}
                />

                <YAxis
                  tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(value: number) => formatWithCommas(value)}
                />

                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={{ color: "var(--font-2)" }}
                  itemStyle={{ color: "var(--font-1)" }}
                  cursor={{ fill: "var(--bg-surface-hover)" }}
                  labelFormatter={(value) =>
                    dayjs(String(value)).format("MM.DD HH:mm")
                  }
                  formatter={(value, name) => [
                    `${formatWithCommas(Number(value))}건`,
                    name === "requestCount" ? "요청" : "오류",
                  ]}
                />

                <Bar
                  dataKey="requestCount"
                  fill="var(--brand-opacity-2)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="errorCount"
                  fill="var(--danger)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResourceUsageChart;
