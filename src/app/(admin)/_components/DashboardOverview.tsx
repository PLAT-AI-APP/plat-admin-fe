"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardSummaryQuery } from "@/api/dashboard/getDashboardSummary";
import { useAdminUniverseCountQuery } from "@/api/universe/getAdminUniverseList";
import { Globe, QuestionCircle, Server } from "@/icons";
import { formatWithCommas } from "@/lib/utils";
import type { DashboardMetricKey } from "@/type/dashboard";
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

/** 카드 안 추이선이 보여 주는 구간(일). 카드 크기에서 점이 뭉개지지 않는 길이다. */
const SPARK_DAYS = 14;

/** 크레딧 사용처 합계 구간(일). 목업이 만드는 구간과 같아야 한다. */
const CREDIT_WINDOW_DAYS = 30;

/**
 * 세계관 심사 대기 숫자의 신선도.
 * 세계관 보드에서 승인·반려하고 돌아오면 곧바로 줄어야 한다.
 */
const PENDING_REVIEW_STALE_TIME = 1000 * 60;

/** 대기 건수 카드 (심사 · 문의 공용) */
const PendingCard = ({
  title,
  description,
  count,
  href,
  linkLabel,
  icon,
}: {
  title: string;
  description: string;
  /** 아직 못 세었으면 비운다. 0을 먼저 그리면 "없다"로 읽힌다. */
  count?: number;
  href: string;
  linkLabel: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="body-5 text-font-2">{title}</p>

        <p className="mt-2 heading-1 font-bold text-font-0 tabular-nums">
          {count === undefined ? "-" : `${formatWithCommas(count)}건`}
        </p>
      </div>

      <span className="shrink-0 text-font-disabled">{icon}</span>
    </div>

    <p className="mt-2 body-5 text-font-2">{description}</p>

    <Link
      href={href}
      className="mt-3 inline-flex body-5 font-medium text-brand transition hover:underline"
    >
      {linkLabel}
    </Link>
  </Card>
);

const DashboardOverview = () => {
  const { data, isLoading, isError, error } = useDashboardSummaryQuery();

  /*
    세계관 심사 대기 건수는 요약 응답에 담지 않고 세계관 목록에서 직접 센다.
    세계관은 이미 실서버로 나가는 도메인이라, 요약이 따로 세면 보드의 "심사 대기"
    탭과 다른 수를 말하게 된다. 같은 질의를 쓰면 두 화면이 어긋날 수 없다.
  */
  const { data: pendingReviewCount } = useAdminUniverseCountQuery(
    { reviewStatus: "PENDING" },
    PENDING_REVIEW_STALE_TIME,
  );

  /** 카드에서 고른 지표. 아래 추이 차트가 이 계열을 그린다. */
  const [metricKey, setMetricKey] = useState<DashboardMetricKey>("activeUsers");

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[168px] w-full rounded-card" />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-[452px] w-full rounded-card" />
          <Skeleton className="h-[452px] w-full rounded-card" />
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

  /* 고른 지표가 응답에 없으면(서버가 지표를 뺀 경우) 첫 카드로 되돌린다. */
  const selectedMetric =
    data.metrics.find((metric) => metric.key === metricKey) ?? data.metrics[0];

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {data.metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            spark={data.trend
              .slice(-SPARK_DAYS)
              .map((point) => point[metric.key])}
            sparkLabel={`최근 ${SPARK_DAYS}일`}
            isActive={metric.key === selectedMetric?.key}
            onSelect={setMetricKey}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {selectedMetric && (
          <TrendChart
            trend={data.trend}
            metric={selectedMetric}
            className="col-span-2"
          />
        )}

        <CreditUsageChart
          creditUsage={data.creditUsage}
          windowDays={CREDIT_WINDOW_DAYS}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="body-5 text-font-2">서버 상태</p>

              <div className="mt-2 flex items-center gap-2">
                <span className="heading-1 font-bold text-font-0">
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

          <p className="mt-2 body-5 text-font-2">
            {HEALTH_DESCRIPTION[data.serverStatus]}
          </p>

          <Link
            href="/ops/server"
            className="mt-3 inline-flex body-5 font-medium text-brand transition hover:underline"
          >
            상세 보기
          </Link>
        </Card>

        <PendingCard
          title="세계관 심사 대기"
          description="승인 전에는 앱에 노출되지 않습니다."
          count={pendingReviewCount}
          href="/universes?reviewStatus=PENDING"
          linkLabel="심사하러 가기"
          icon={<Globe size={22} />}
        />

        <PendingCard
          title="Q&A 문의 대기"
          description="답변하지 않은 문의입니다."
          count={data.pendingQnaCount}
          href="/communication/qna"
          linkLabel="답변하러 가기"
          icon={<QuestionCircle size={22} />}
        />
      </div>
    </>
  );
};

export default DashboardOverview;
