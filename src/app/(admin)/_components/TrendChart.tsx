"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "@/lib/dayjs";
import { cn, formatDelta } from "@/lib/utils";
import type { DashboardMetric, DashboardTrendPoint } from "@/type/dashboard";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import {
  deltaRateOf,
  formatMetricAxis,
  formatMetricValue,
  isAdditiveMetric,
  resolveDelta,
} from "./dashboardMetric";

interface TrendChartProps {
  /** 지표별 일자 계열. 뒤쪽이 최신이다. */
  trend: DashboardTrendPoint[];
  /** 지금 그릴 지표. 위 카드에서 고른다. */
  metric: DashboardMetric;
  className?: string;
}

/** 화면에서 고를 수 있는 구간(일). 목업·서버 모두 이 두 배만큼 내려준다. */
const PERIOD_OPTIONS = [7, 14, 30] as const;

type Period = (typeof PERIOD_OPTIONS)[number];

/**
 * 차트 색은 반드시 CSS 변수를 통해 지정한다.
 * 라이트/다크 테마가 바뀌어도 별도 처리 없이 따라간다.
 */
const CHART_COLOR = "var(--brand)";
const BASE_COLOR = "var(--font-2)";
const AXIS_COLOR = "var(--font-2)";
const GRID_COLOR = "var(--border)";

/** 증감 방향별 색. 0%는 좋고 나쁨이 없어 색을 입히지 않는다. */
const DELTA_CLASS = {
  UP: "text-success",
  DOWN: "text-danger",
  FLAT: "text-font-2",
} as const;

/** 차트가 그리는 한 줄. 같은 자리의 직전 기간 값을 함께 들고 있는다. */
interface TrendRow {
  date: string;
  value: number;
  /** 직전 기간 같은 순번의 값. 기간 앞쪽이 모자라면 없다. */
  baseValue: number | null;
  baseDate: string | null;
}

const formatDay = (value: string) => dayjs(value).format("MM.DD");

/* ------------------------------------------------------------------ */
/* 툴팁                                                                 */
/* ------------------------------------------------------------------ */

interface TrendTooltipProps {
  /* recharts가 넣어 주는 값들. 직접 넘기지 않으므로 전부 선택값이다. */
  active?: boolean;
  payload?: { payload: TrendRow }[];
  metric: DashboardMetric;
  showBase: boolean;
}

/**
 * 직접 그린 툴팁.
 *
 * 기본 툴팁은 두 계열에 같은 날짜 라벨을 붙인다. 비교선은 **한 기간 앞의 값**이라
 * 같은 날짜로 적으면 거짓말이 되므로, 각 줄에 자기 날짜를 함께 적는다.
 */
const TrendTooltip = ({
  active,
  payload,
  metric,
  showBase,
}: TrendTooltipProps) => {
  const row = payload?.[0]?.payload;

  if (!active || !row) return null;

  const diff = row.baseValue === null ? null : row.value - row.baseValue;
  const rate =
    row.baseValue === null ? undefined : deltaRateOf(row.value, row.baseValue);

  return (
    <div className="rounded-field border border-border-main bg-surface px-3 py-2 shadow-popover">
      <p className="body-6 text-font-2">
        {dayjs(row.date).format("YYYY.MM.DD (ddd)")}
      </p>

      <p className="mt-1 body-4 font-semibold text-font-0 tabular-nums">
        {formatMetricValue(row.value, metric)}
      </p>

      {showBase && row.baseValue !== null && (
        <div className="mt-2 border-t border-border-main pt-2">
          <p className="body-6 text-font-2 tabular-nums">
            {formatDay(row.baseDate ?? "")} ·{" "}
            {formatMetricValue(row.baseValue, metric)}
          </p>

          {rate !== undefined && diff !== null && (
            <p
              className={cn(
                "mt-0.5 body-6 font-medium tabular-nums",
                DELTA_CLASS[resolveDelta(diff)],
              )}
            >
              {formatDelta(rate)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 구간 선택                                                             */
/* ------------------------------------------------------------------ */

const PeriodPicker = ({
  value,
  onChange,
}: {
  value: Period;
  onChange: (value: Period) => void;
}) => (
  <div
    role="group"
    aria-label="추이 구간 선택"
    className="flex items-center gap-0.5 rounded-field border border-border-main p-0.5"
  >
    {PERIOD_OPTIONS.map((option) => (
      <button
        key={option}
        type="button"
        aria-pressed={option === value}
        onClick={() => onChange(option)}
        className={cn(
          "cursor-pointer rounded-chip px-2.5 py-1 body-5 transition",
          option === value
            ? "bg-brand font-semibold text-font-4"
            : "text-font-2 hover:text-font-1",
        )}
      >
        {option}일
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* 구간 요약                                                             */
/* ------------------------------------------------------------------ */

const SummaryCell = ({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) => (
  <div className="min-w-0">
    <dt className="body-6 text-font-2">{label}</dt>

    <dd
      className={cn(
        "mt-1 truncate body-3 font-semibold text-font-0 tabular-nums",
        valueClassName,
      )}
    >
      {value}
    </dd>

    {sub && <dd className="mt-0.5 body-6 text-font-disabled">{sub}</dd>}
  </div>
);

/* ------------------------------------------------------------------ */

/**
 * 일자별 추이.
 *
 * 지표는 위 카드에서 고르고, 이 카드는 **구간**과 **비교 여부**만 정한다.
 * 지표 Select를 따로 두지 않는 이유는 고르는 자리가 둘이면 카드와 차트가
 * 서로 다른 지표를 가리킬 수 있기 때문이다.
 */
const TrendChart = ({ trend, metric, className }: TrendChartProps) => {
  const [period, setPeriod] = useState<Period>(30);
  const [showBase, setShowBase] = useState(true);

  const current = trend.slice(-period);
  // 직전 기간. 데이터가 모자라면 앞쪽이 비고, 그 자리는 비교선이 끊긴다.
  const base = trend.slice(-period * 2, -period);

  const rows: TrendRow[] = current.map((point, index) => {
    // 두 구간의 길이가 다를 수 있으므로 뒤에서부터 짝을 맞춘다.
    const basePoint = base[base.length - current.length + index];

    return {
      date: point.date,
      value: point[metric.key],
      baseValue: basePoint?.[metric.key] ?? null,
      baseDate: basePoint?.date ?? null,
    };
  });

  const additive = isAdditiveMetric(metric.key);

  /** 합계가 의미 없는 지표(DAU 등)는 평균으로 요약한다. */
  const aggregate = (values: number[]) => {
    if (!values.length) return 0;

    const sum = values.reduce((total, value) => total + value, 0);

    return additive ? sum : Math.round(sum / values.length);
  };

  const currentTotal = aggregate(rows.map((row) => row.value));
  const baseValues = base.map((point) => point[metric.key]);
  const baseTotal = aggregate(baseValues);
  const periodRate = baseValues.length
    ? deltaRateOf(currentTotal, baseTotal)
    : undefined;

  const peak = rows.reduce(
    (best, row) => (row.value > best.value ? row : best),
    rows[0],
  );
  const bottom = rows.reduce(
    (worst, row) => (row.value < worst.value ? row : worst),
    rows[0],
  );

  const rangeLabel = rows.length
    ? `${dayjs(rows[0].date).format("YYYY.MM.DD")} ~ ${dayjs(
        rows[rows.length - 1].date,
      ).format("MM.DD")}`
    : "-";

  return (
    <Card
      className={className}
      title="일자별 추이"
      description={`${metric.label} · ${rangeLabel}`}
      action={
        <>
          <label className="flex cursor-pointer items-center gap-2">
            <span className="body-5 text-font-2">직전 기간</span>
            <Switch
              checked={showBase}
              onChange={setShowBase}
              label="직전 기간 비교선 표시"
            />
          </label>

          <PeriodPicker value={period} onChange={setPeriod} />
        </>
      }
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={rows}
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
              tickFormatter={formatDay}
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
              tickFormatter={formatMetricAxis}
            />

            <Tooltip
              cursor={{ stroke: GRID_COLOR }}
              content={<TrendTooltip metric={metric} showBase={showBase} />}
            />

            {/* 비교선을 먼저 그려 현재 구간 선 아래에 깔리게 한다. */}
            {showBase && (
              <Line
                type="monotone"
                dataKey="baseValue"
                stroke={BASE_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                // 값이 없는 앞부분은 선을 잇지 않는다. 이으면 없는 값을 지어낸다.
                connectNulls={false}
                isAnimationActive={false}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
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

      {/* 차트에서 눈으로 읽어야 했던 것들을 숫자로 못 박아 둔다. */}
      <dl className="mt-4 grid grid-cols-4 gap-4 border-t border-border-main pt-4">
        <SummaryCell
          label={additive ? `${period}일 합계` : `${period}일 일평균`}
          value={formatMetricValue(currentTotal, metric)}
        />

        <SummaryCell
          label={`직전 ${period}일 대비`}
          value={periodRate === undefined ? "-" : formatDelta(periodRate)}
          sub={
            baseValues.length
              ? `직전 ${formatMetricValue(baseTotal, metric)}`
              : "비교할 기간 없음"
          }
          valueClassName={
            periodRate === undefined
              ? undefined
              : DELTA_CLASS[resolveDelta(periodRate)]
          }
        />

        <SummaryCell
          label="최고"
          value={peak ? formatMetricValue(peak.value, metric) : "-"}
          sub={peak ? formatDay(peak.date) : undefined}
        />

        <SummaryCell
          label="최저"
          value={bottom ? formatMetricValue(bottom.value, metric) : "-"}
          sub={bottom ? formatDay(bottom.date) : undefined}
        />
      </dl>
    </Card>
  );
};

export default TrendChart;
