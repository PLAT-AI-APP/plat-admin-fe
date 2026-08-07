"use client";

import Link from "next/link";
import { useDashboardSummaryQuery } from "@/api/dashboard/getDashboardSummary";
import { Flag, QuestionCircle, Server } from "@/icons";
import { formatWithCommas } from "@/lib/utils";
import type { HealthStatus } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import CreditUsageChart from "./CreditUsageChart";
import MetricCard from "./MetricCard";
import TrendChart from "./TrendChart";

/** 서버 상태 표기. 서버 상태 화면과 동일한 문구를 쓴다. */
const HEALTH_LABEL: Record<HealthStatus, string> = {
  UP: "정상",
  DEGRADED: "일부 지연",
  DOWN: "장애",
};

const HEALTH_TONE: Record<HealthStatus, BadgeTone> = {
  UP: "success",
  DEGRADED: "warning",
  DOWN: "danger",
};

const HEALTH_DESCRIPTION: Record<HealthStatus, string> = {
  UP: "모든 의존성이 정상 응답 중입니다.",
  DEGRADED: "일부 외부 의존성 응답이 지연되고 있습니다.",
  DOWN: "장애가 발생했습니다. 즉시 확인이 필요합니다.",
};

/** 대기 건수 카드 (신고 · 문의 공용) */
const PendingCard = ({
  title,
  count,
  href,
  icon,
}: {
  title: string;
  count: number;
  href: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-font-2">{title}</p>
        <p className="mt-2 text-[26px] font-bold text-font-0 tabular-nums">
          {formatWithCommas(count)}건
        </p>
      </div>

      <span className="shrink-0 text-font-disabled">{icon}</span>
    </div>

    <Link
      href={href}
      className="mt-3 inline-flex text-[13px] font-medium text-brand transition hover:underline"
    >
      바로 가기
    </Link>
  </Card>
);

const DashboardOverview = () => {
  const { data, isLoading, isError, error } = useDashboardSummaryQuery();

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[104px] w-full rounded-card" />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-[368px] w-full rounded-card" />
          <Skeleton className="h-[368px] w-full rounded-card" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <Alert tone="danger" title="대시보드를 불러오지 못했습니다.">
        {error?.message ?? "잠시 후 다시 시도해 주세요."}
      </Alert>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TrendChart trend={data.trend} className="col-span-2" />
        <CreditUsageChart creditUsage={data.creditUsage} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-font-2">서버 상태</p>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-[26px] font-bold text-font-0">
                  {HEALTH_LABEL[data.serverStatus]}
                </span>
                <Badge tone={HEALTH_TONE[data.serverStatus]}>
                  {data.serverStatus}
                </Badge>
              </div>
            </div>

            <span className="shrink-0 text-font-disabled">
              <Server size={22} />
            </span>
          </div>

          <p className="mt-2 text-[13px] text-font-2">
            {HEALTH_DESCRIPTION[data.serverStatus]}
          </p>

          <Link
            href="/ops/server"
            className="mt-3 inline-flex text-[13px] font-medium text-brand transition hover:underline"
          >
            상세 보기
          </Link>
        </Card>

        <PendingCard
          title="대기 중 캐릭터 신고"
          count={data.pendingReportCount}
          href="/characters/reports"
          icon={<Flag size={22} />}
        />

        <PendingCard
          title="대기 중 Q&A 문의"
          count={data.pendingQnaCount}
          href="/communication/qna"
          icon={<QuestionCircle size={22} />}
        />
      </div>
    </>
  );
};

export default DashboardOverview;
