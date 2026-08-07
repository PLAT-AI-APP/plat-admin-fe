"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import type { DashboardTrendPoint } from "@/type/dashboard";
import Card from "@/components/ui/Card";
import Select, { type SelectOption } from "@/components/ui/Select";

interface TrendChartProps {
  trend: DashboardTrendPoint[];
  className?: string;
}

/** 차트에 그릴 수 있는 지표. DashboardTrendPoint의 숫자 필드와 1:1로 대응한다. */
type TrendMetricKey = "activeUsers" | "newUsers" | "chatCount" | "paidAmount";

const METRIC_OPTIONS: SelectOption<TrendMetricKey>[] = [
  { label: "활성 유저", value: "activeUsers" },
  { label: "신규 가입", value: "newUsers" },
  { label: "대화 수", value: "chatCount" },
  { label: "결제 금액", value: "paidAmount" },
];

/**
 * 차트 색은 반드시 CSS 변수를 통해 지정한다.
 * 라이트/다크 테마가 바뀌어도 별도 처리 없이 따라간다.
 */
const CHART_COLOR = "var(--brand)";
const AXIS_COLOR = "var(--font-2)";
const GRID_COLOR = "var(--border)";

/** 툴팁도 카드와 같은 표면 토큰을 쓴다. */
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-popover)",
  fontSize: 13,
} as const;

const TrendChart = ({ trend, className }: TrendChartProps) => {
  const [metricKey, setMetricKey] = useState<TrendMetricKey>("activeUsers");

  const selectedOption = METRIC_OPTIONS.find(
    (option) => option.value === metricKey,
  );

  const formatValue = (value: number) =>
    metricKey === "paidAmount"
      ? formatCurrency(value)
      : formatWithCommas(value);

  return (
    <Card
      className={className}
      title="일자별 추이"
      description="최근 30일"
      action={
        <Select
          options={METRIC_OPTIONS}
          value={metricKey}
          onChange={(event) =>
            setMetricKey(event.target.value as TrendMetricKey)
          }
          selectBoxClassName="h-8 w-[132px]"
          className="text-[13px]"
          aria-label="추이 지표 선택"
        />
      }
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => dayjs(value).format("MM.DD")}
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              minTickGap={24}
            />

            <YAxis
              tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatWithCommas(value)}
            />

            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={{ color: "var(--font-2)" }}
              itemStyle={{ color: "var(--font-1)" }}
              cursor={{ stroke: GRID_COLOR }}
              labelFormatter={(value) =>
                dayjs(String(value)).format("YYYY.MM.DD")
              }
              formatter={(value) => [
                formatValue(Number(value)),
                selectedOption?.label ?? "",
              ]}
            />

            <Area
              type="monotone"
              dataKey={metricKey}
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill="url(#trend-area)"
              activeDot={{ r: 4, strokeWidth: 0 }}
              // 기본 1.5초는 운영 화면에서 너무 느리다. 지표를 바로 읽을 수 있게 짧게 준다.
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TrendChart;
