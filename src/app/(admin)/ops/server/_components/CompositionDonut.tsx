"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBytes } from "@/lib/utils";
import { DONUT_SIZE } from "../_constants/serverStatus";

export interface CompositionSlice {
  key: string;
  label: string;
  /** 바이트 등 절대량. 합이 곧 전체가 되도록 겹치지 않는 값만 넣는다. */
  value: number;
  color: string;
  description?: string;
}

interface CompositionDonutProps {
  slices: CompositionSlice[];
  /** 가운데 글자. 보통 전체 용량을 적는다. */
  centerLabel: string;
  centerValue: string;
  size?: number;
  formatValue?: (value: number) => string;
  /** 범례를 끈다. 아래 표가 같은 색 점을 달고 범례 노릇을 할 때 쓴다. */
  hasLegend?: boolean;
}

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-popover)",
  fontSize: 13,
} as const;

/**
 * 구성을 도넛 하나와 범례 목록으로 보여 준다.
 *
 * 범례에 절대량과 비율을 함께 적는다. 조각 크기만으로는 "몇 GB인지"를 읽을 수
 * 없고, 조치를 정하려면 결국 절대량이 필요하다.
 */
const CompositionDonut = ({
  slices,
  centerLabel,
  centerValue,
  size = DONUT_SIZE,
  formatValue = formatBytes,
  hasLegend = true,
}: CompositionDonutProps) => {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const visible = slices.filter((slice) => slice.value > 0);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="label"
              innerRadius="76%"
              outerRadius="100%"
              paddingAngle={visible.length > 1 ? 1.5 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {visible.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              itemStyle={{ color: "var(--font-1)" }}
              formatter={(value, name) => [
                `${formatValue(Number(value))} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : "0.0"}%)`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="body-6 text-font-2">{centerLabel}</span>
          <span className="body-3 font-bold text-font-0 tabular-nums">
            {centerValue}
          </span>
        </div>
      </div>

      {hasLegend && (
      <ul className="min-w-[220px] flex-1">
        {slices.map((slice) => {
          const share = total > 0 ? (slice.value / total) * 100 : 0;

          return (
            <li
              key={slice.key}
              className="flex items-start justify-between gap-3 border-t border-border-main py-2.5 first:border-t-0 first:pt-0"
            >
              <span className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0">
                  <span className="block body-5 text-font-1">{slice.label}</span>
                  {slice.description && (
                    <span className="block body-6 text-font-2">
                      {slice.description}
                    </span>
                  )}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block body-5 font-medium text-font-1 tabular-nums">
                  {formatValue(slice.value)}
                </span>
                <span className="block body-6 text-font-2 tabular-nums">
                  {share.toFixed(1)}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
};

export default CompositionDonut;
