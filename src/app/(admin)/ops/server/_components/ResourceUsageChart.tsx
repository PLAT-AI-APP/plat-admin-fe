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
const CPU_COLOR = "var(--brand)";
const MEMORY_COLOR = "var(--info)";
const AXIS_COLOR = "var(--font-2)";
const GRID_COLOR = "var(--border)";

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-popover)",
  fontSize: 13,
} as const;

const SERIES_LABEL: Record<string, string> = {
  cpuUsage: "CPU",
  memoryUsage: "메모리",
};

const ResourceUsageChart = ({ metrics }: ResourceUsageChartProps) => {
  return (
    <Card
      title="자원 사용률 추이"
      description="최근 24시간 · 1시간 단위"
      action={
        <div className="flex items-center gap-3">
          {(["cpuUsage", "memoryUsage"] as const).map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor:
                    key === "cpuUsage" ? CPU_COLOR : MEMORY_COLOR,
                }}
              />
              <span className="body-5 text-font-2">
                {SERIES_LABEL[key]}
              </span>
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
            <Line
              type="monotone"
              dataKey="cpuUsage"
              stroke={CPU_COLOR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />

            <Line
              type="monotone"
              dataKey="memoryUsage"
              stroke={MEMORY_COLOR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ResourceUsageChart;
