"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ServerMetricPoint } from "@/api/ops/getServerMetrics";
import dayjs from "@/lib/dayjs";
import Card from "@/components/ui/Card";

interface ResourceUsageChartProps {
  metrics: ServerMetricPoint[];
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
 * 시작하고, 응답이 느려진 원인은 그쪽인 경우가 많다. 두 선을 겹쳐 봐야 어느
 * 쪽인지 갈린다.
 *
 * 색은 다른 차트와 같은 순서(브랜드 → info → success)를 따른다.
 */
const SERIES = [
  { key: "cpuUsage", label: "CPU", color: "var(--brand)" },
  { key: "memoryUsage", label: "메모리", color: "var(--info)" },
  { key: "heapUsage", label: "JVM 힙", color: "var(--success)" },
] as const satisfies readonly {
  key: keyof ServerMetricPoint;
  label: string;
  color: string;
}[];

const SERIES_LABEL: Record<string, string> = Object.fromEntries(
  SERIES.map((series) => [series.key, series.label]),
);

const ResourceUsageChart = ({ metrics }: ResourceUsageChartProps) => {
  return (
    <Card
      title="자원 사용률 추이"
      description="최근 24시간 · 1시간 단위"
      action={
        <div className="flex items-center gap-3">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="body-5 text-font-2">{series.label}</span>
            </span>
          ))}
        </div>
      }
    >
      <div className="h-[220px] w-full">
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
              tickFormatter={(value: string) => dayjs(value).format("HH:mm")}
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
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ResourceUsageChart;
