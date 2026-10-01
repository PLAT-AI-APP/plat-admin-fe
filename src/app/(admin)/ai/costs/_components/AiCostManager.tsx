"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs, { nowKst, todayKst } from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import { useAiCostsQuery } from "@/api/ai/getAiCosts";
import type { AiCost, AiCostPurpose, AiCostReport } from "@/type/aiCost";
import type { UserStatus } from "@/type/user";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";
import Skeleton from "@/components/ui/Skeleton";
import Table, { TableColumn } from "@/components/ui/Table";

/** 서버가 받는 최대 기간(양 끝 포함). 넘으면 조회하지 않고 안내만 한다. */
const MAX_DAYS = 92;

const defaultRange = (): DateRange => ({
  startDate: nowKst().subtract(29, "day").format("YYYY-MM-DD"),
  endDate: todayKst(),
});

const COST_COLOR = "var(--danger)";
const REVENUE_COLOR = "var(--brand)";
const AXIS_COLOR = "var(--font-2)";
const GRID_COLOR = "var(--border)";

/** 턴당 원가처럼 작은 값은 소수 둘째 자리까지, 100원 이상은 정수로 읽는다. */
const formatWon = (value: number) =>
  `${formatWithCommas(
    Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(2)),
  )}원`;

const formatRate = (value: number | null) =>
  value === null ? "-" : `${(value * 100).toFixed(1)}%`;

const formatTokens = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}K`
      : formatWithCommas(value);

const marginTone = (rate: number | null) =>
  rate === null ? "text-font-2" : rate < 0 ? "text-danger" : "text-success";

/* ------------------------------------------------------------------ */

const SummaryTile = ({
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
  <Card>
    <p className="body-5 text-font-2">{label}</p>
    <p
      className={cn(
        "mt-1 heading-3 font-semibold text-font-0 tabular-nums",
        valueClassName,
      )}
    >
      {value}
    </p>
    {sub && <p className="mt-1 body-6 text-font-2 tabular-nums">{sub}</p>}
  </Card>
);

const Summary = ({ total }: { total: AiCost }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <SummaryTile
      label="제공사 원가"
      value={formatWon(total.costKrw)}
      sub={`채팅 ${formatWon(total.chatCostKrw)} · 그 외 ${formatWon(
        total.otherCostKrw,
      )}`}
    />
    <SummaryTile
      label="매출 (부가세 제외)"
      value={formatWon(total.netRevenueKrw)}
      sub={`결제 크레딧 ${formatWithCommas(total.paidCredits)} / 전체 ${formatWithCommas(
        total.credits,
      )}`}
    />
    <SummaryTile
      label="이익 · 마진율"
      value={formatWon(total.grossProfitKrw)}
      sub={`마진율 ${formatRate(total.marginRate)}`}
      valueClassName={marginTone(total.marginRate)}
    />
    <SummaryTile
      label="크레딧 1개당 원가"
      value={
        total.costPerCredit === null ? "-" : formatWon(total.costPerCredit)
      }
      sub={`대화 ${formatWithCommas(total.turns)}턴 · 실패 ${formatWithCommas(
        total.turns - total.settledTurns,
      )}턴 · 그 외 호출 ${formatWithCommas(total.otherCalls)}회`}
    />
  </div>
);

/* ------------------------------------------------------------------ */

const DailyChart = ({ daily }: { daily: AiCostReport["daily"] }) => {
  const rows = daily.map(({ date, cost }) => ({
    date,
    cost: cost.costKrw,
    revenue: cost.netRevenueKrw,
  }));

  return (
    <Card title="일자별 원가 · 매출" description="한국 날짜 기준">
      {rows.length === 0 ? (
        <p className="py-10 text-center body-5 text-font-2">
          기간 안에 대화가 없습니다.
        </p>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
            >
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
                width={64}
                tickFormatter={(value: number) => formatWithCommas(value)}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatWon(Number(value)),
                  name === "cost" ? "원가" : "매출",
                ]}
                labelFormatter={(label) =>
                  dayjs(String(label)).format("YYYY.MM.DD (ddd)")
                }
              />
              <Legend
                formatter={(value) => (value === "cost" ? "원가" : "매출")}
              />
              <Bar
                dataKey="cost"
                fill={COST_COLOR}
                radius={[3, 3, 0, 0]}
                animationDuration={400}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={REVENUE_COLOR}
                strokeWidth={2}
                dot={false}
                animationDuration={400}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */

const PURPOSE_LABEL: Record<AiCostPurpose, string> = {
  CHAT: "채팅 답변",
  MEMORY_SUMMARY: "장기기억 요약",
  MODEL_PING: "모델 점검",
  KEY_CHECK: "API 키 확인",
};

type PurposeRow = AiCostReport["purposes"][number];
type ModelRow = AiCostReport["models"][number];
type UserRow = AiCostReport["topUsers"][number];

const costColumns = <T extends { cost: AiCost }>(): TableColumn<T>[] => [
  {
    key: "calls",
    header: "호출",
    align: "right",
    numeric: true,
    render: ({ cost }) => formatWithCommas(cost.turns + cost.otherCalls),
  },
  {
    key: "cost",
    header: "원가",
    align: "right",
    numeric: true,
    render: ({ cost }) => formatWon(cost.costKrw),
  },
  {
    key: "credits",
    header: "쓴 크레딧 (결제)",
    align: "right",
    numeric: true,
    render: ({ cost }) =>
      `${formatWithCommas(cost.credits)} (${formatWithCommas(cost.paidCredits)})`,
  },
  {
    key: "revenue",
    header: "매출",
    align: "right",
    numeric: true,
    render: ({ cost }) => formatWon(cost.netRevenueKrw),
  },
  {
    key: "margin",
    header: "마진율",
    align: "right",
    numeric: true,
    render: ({ cost }) => (
      <span className={marginTone(cost.marginRate)}>
        {formatRate(cost.marginRate)}
      </span>
    ),
  },
];

/** 입력은 캐시 안 거친 몫, 캐시는 읽기(싸게 매김) 몫이다. 캐시 쓰기는 툴팁에 둔다. */
const tokenColumn = <T extends { cost: AiCost }>(): TableColumn<T> => ({
  key: "tokens",
  header: "토큰 (입력 / 캐시 / 출력)",
  align: "right",
  numeric: true,
  render: ({ cost }) => (
    <span
      title={`캐시 쓰기 ${formatWithCommas(cost.cacheWriteTokens)} 토큰`}
    >
      {formatTokens(cost.inputTokens)} / {formatTokens(cost.cacheReadTokens)} /{" "}
      {formatTokens(cost.outputTokens)}
    </span>
  ),
});

const MODEL_COLUMNS: TableColumn<ModelRow>[] = [
  {
    key: "model",
    header: "모델",
    render: ({ model, cost }) => (
      <div className="flex items-center gap-2">
        <span className="body-5 text-font-0">{model ?? "(기록 없음)"}</span>
        {cost.unpricedTurns > 0 && (
          <Badge tone="warning">원가 모름 {cost.unpricedTurns}회</Badge>
        )}
      </div>
    ),
  },
  tokenColumn<ModelRow>(),
  ...costColumns<ModelRow>(),
];

const PURPOSE_COLUMNS: TableColumn<PurposeRow>[] = [
  {
    key: "purpose",
    header: "용도",
    render: ({ purpose, cost }) => (
      <div className="flex items-center gap-2">
        <span className="body-5 text-font-0">
          {PURPOSE_LABEL[purpose] ?? purpose}
        </span>
        {cost.unpricedTurns > 0 && (
          <Badge tone="warning">원가 모름 {cost.unpricedTurns}회</Badge>
        )}
      </div>
    ),
  },
  tokenColumn<PurposeRow>(),
  ...costColumns<PurposeRow>(),
];

const USER_COLUMNS: TableColumn<UserRow>[] = [
  {
    key: "rank",
    header: "#",
    width: "48px",
    numeric: true,
    render: (_, index) => index + 1,
  },
  {
    key: "user",
    header: "유저",
    render: ({ userId, nickname, status }) => (
      <div className="flex items-center gap-2">
        <span className="body-5 text-font-0">{nickname ?? userId}</span>
        {status && status !== "ACTIVE" && (
          <Badge tone={USER_STATUS_TONE[status as UserStatus] ?? "neutral"}>
            {USER_STATUS_LABEL[status as UserStatus] ?? status}
          </Badge>
        )}
      </div>
    ),
  },
  ...costColumns<UserRow>(),
];

/* ------------------------------------------------------------------ */

const spanDays = ({ startDate, endDate }: DateRange) =>
  dayjs(endDate).diff(dayjs(startDate), "day") + 1;

/**
 * AI 원가.
 *
 * 대화 턴마다 남긴 제공사 원가와 그 턴이 쓴 크레딧의 매출을 맞대어 본다. 매출은 결제로 산 크레딧 몫만 실결제액으로 환산하므로,
 * 무료 크레딧으로 쓴 대화는 원가만 있고 매출이 없다 — 베타처럼 무료 지급이 많을 때 마진이 낮게 나오는 것이 정상이다.
 */
const AiCostManager = () => {
  const [range, setRange] = useState<DateRange>(defaultRange);

  const tooLong = spanDays(range) > MAX_DAYS;
  const { data, isLoading, error } = useAiCostsQuery(
    { from: range.startDate, to: range.endDate },
    !tooLong,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card bodyClassName="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          value={range}
          // '전체'는 원본 표를 통째로 훑게 되므로 기본 30일로 되돌린다.
          onChange={(next) =>
            setRange(next.startDate && next.endDate ? next : defaultRange())
          }
        />
        {data && (
          <span className="body-5 text-font-2 tabular-nums">
            {dayjs(data.from).format("YYYY.MM.DD")} ~{" "}
            {dayjs(data.to).format("YYYY.MM.DD")}
          </span>
        )}
      </Card>

      {tooLong && (
        <Alert tone="warning">
          한 번에 {MAX_DAYS}일까지 조회할 수 있습니다. 기간을 줄여 주세요.
        </Alert>
      )}

      {error && !tooLong && (
        <Alert tone="danger">{error.message || "원가를 불러오지 못했습니다."}</Alert>
      )}

      {isLoading && !tooLong ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[104px]" />
          ))}
        </div>
      ) : (
        data && (
          <>
            {data.total.unpricedTurns > 0 && (
              <Alert tone="info">
                원가를 알 수 없는 호출이{" "}
                {formatWithCommas(data.total.unpricedTurns)}회 있습니다. 모델
                단가가 비어 있거나 제공사가 토큰 수를 주지 않은 호출이라 원가
                합계에서 빠졌습니다.
              </Alert>
            )}

            <Summary total={data.total} />

            <DailyChart daily={data.daily} />

            <Card
              title="용도별"
              description="채팅 답변과 그 밖의 AI 호출(장기기억 요약 · 점검 · 키 확인)"
              bodyClassName="p-0"
            >
              <Table
                columns={PURPOSE_COLUMNS}
                rows={data.purposes}
                getRowKey={(row) => row.purpose}
                minRows={0}
                emptyTitle="기간 안에 AI 호출이 없습니다."
              />
            </Card>

            <Card title="모델별" bodyClassName="p-0">
              <Table
                columns={MODEL_COLUMNS}
                rows={data.models}
                getRowKey={(row) => row.model ?? "unknown"}
                minRows={0}
                emptyTitle="기간 안에 대화가 없습니다."
              />
            </Card>

            <Card
              title="원가 상위 유저"
              description="원가(채팅 + 장기기억 요약)가 큰 순 20명. 누르면 유저 상세로 갑니다."
              bodyClassName="p-0"
            >
              <Table
                columns={USER_COLUMNS}
                rows={data.topUsers}
                getRowKey={(row) => row.userId}
                getRowHref={(row) => `/users/${row.userId}`}
                minRows={0}
                emptyTitle="기간 안에 대화가 없습니다."
              />
            </Card>
          </>
        )
      )}
    </div>
  );
};

export default AiCostManager;
