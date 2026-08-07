"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCredit, formatWithCommas } from "@/lib/utils";
import type { DashboardSummary } from "@/type/dashboard";
import Card from "@/components/ui/Card";

interface CreditUsageChartProps {
  creditUsage: DashboardSummary["creditUsage"];
}

/** 사용처 색상. 상태 색과 겹치지 않도록 브랜드 → 정보 → 성공 순으로 배분한다. */
const SLICE_COLORS = [
  "var(--brand)",
  "var(--info)",
  "var(--success)",
  "var(--warning)",
  "var(--neutral)",
] as const;

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-popover)",
  fontSize: 13,
} as const;

const CreditUsageChart = ({ creditUsage }: CreditUsageChartProps) => {
  const total = creditUsage.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card title="크레딧 사용처" description={`최근 30일 · 총 ${formatCredit(total)}`}>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={creditUsage}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={2}
              stroke="var(--bg-surface)"
              strokeWidth={2}
              // recharts 파이의 sweep 애니메이션이 간헐적으로 시작 각도에서 멈춘다.
              // 운영 도구는 즉시성이 우선이므로 애니메이션 없이 바로 그린다.
              isAnimationActive={false}
            >
              {creditUsage.map((item, index) => (
                <Cell
                  key={item.label}
                  fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              itemStyle={{ color: "var(--font-1)" }}
              formatter={(value) => formatCredit(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* recharts 기본 Legend는 토큰 색을 적용하기 어려워 직접 그린다. */}
      <ul className="mt-4 flex flex-col gap-2">
        {creditUsage.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
              }}
            />

            <span className="min-w-0 flex-1 truncate text-[13px] text-font-1">
              {item.label}
            </span>

            <span className="text-[13px] text-font-2 tabular-nums">
              {formatWithCommas(item.value)}
            </span>

            <span className="w-11 text-right text-[12px] text-font-2 tabular-nums">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default CreditUsageChart;
