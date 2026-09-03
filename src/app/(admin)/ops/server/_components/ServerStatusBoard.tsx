"use client";

import { useServerHealthQuery } from "@/api/ops/getServerHealth";
import { useServerMetricsQuery } from "@/api/ops/getServerMetrics";
import { Refresh } from "@/icons";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { formatBytes, formatWithCommas } from "@/lib/utils";
import type { DependencyHealth, HealthStatus } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import ResourceUsageChart from "./ResourceUsageChart";
import UsageBar from "./UsageBar";

/** 서버 상태 enum은 화면에 그대로 노출하지 않고 한국어로 옮긴다. */
const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  UP: "정상",
  DEGRADED: "성능 저하",
  DOWN: "장애",
};

const HEALTH_STATUS_TONE: Record<HealthStatus, BadgeTone> = {
  UP: "success",
  DEGRADED: "warning",
  DOWN: "danger",
};

/** 전체 상태별로 무엇을 확인하면 되는지 함께 안내한다. */
const HEALTH_STATUS_DESCRIPTION: Record<HealthStatus, string> = {
  UP: "모든 의존성이 정상 응답하고 있습니다.",
  DEGRADED: "일부 의존성의 응답이 느립니다. 아래 목록에서 대상을 확인해 주세요.",
  DOWN: "응답하지 않는 의존성이 있습니다. 즉시 확인이 필요합니다.",
};

const SECONDS_PER_DAY = 24 * 60 * 60;
const SECONDS_PER_HOUR = 60 * 60;

/** 초 단위 업타임을 사람이 읽는 형식(일/시/분)으로 바꾼다. */
const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((uptimeSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((uptimeSeconds % SECONDS_PER_HOUR) / 60);

  const parts: string[] = [];

  if (days > 0) parts.push(`${formatWithCommas(days)}일`);
  // 일 단위가 있으면 "17일 3분"처럼 시간이 빠져 보이지 않도록 0시간도 함께 적는다.
  if (hours > 0 || days > 0) parts.push(`${hours}시간`);
  parts.push(`${minutes}분`);

  return parts.join(" ");
};

/** 요약 카드 안에서 반복되는 라벨 + 값 한 줄 */
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 border-t border-border-main py-3 first:border-t-0 first:pt-0">
    <span className="body-5 text-font-2">{label}</span>
    <span className="body-4 font-medium text-font-1 tabular-nums">
      {value}
    </span>
  </div>
);

const ServerStatusBoard = () => {
  const healthQuery = useServerHealthQuery();
  const metricsQuery = useServerMetricsQuery();

  const health = healthQuery.data;
  const isRefreshing = healthQuery.isFetching || metricsQuery.isFetching;

  /**
   * 새로고침 버튼은 두 조회를 함께 다시 부른다.
   * refetch는 실패해도 reject하지 않으므로 결과 객체로 성공 여부를 판단한다.
   */
  const handleRefresh = async () => {
    const [healthResult] = await Promise.all([
      healthQuery.refetch(),
      metricsQuery.refetch(),
    ]);

    if (healthResult.isError) {
      showErrorToast(healthResult.error);
      return;
    }

    showAppToast("success", "서버 상태를 다시 조회했습니다.");
  };

  const dependencyColumns: TableColumn<DependencyHealth>[] = [
    {
      key: "name",
      header: "이름",
      width: "240px",
      render: (row) => <span className="text-font-1">{row.name}</span>,
    },
    {
      key: "status",
      header: "상태",
      width: "120px",
      render: (row) => (
        <Badge tone={HEALTH_STATUS_TONE[row.status]}>
          {HEALTH_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "latencyMs",
      header: "응답 시간",
      width: "120px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="text-font-1">
          {formatWithCommas(row.latencyMs)} ms
        </span>
      ),
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => (
        <span className="text-font-2">{row.message ?? "-"}</span>
      ),
    },
  ];

  return (
    <>
      {healthQuery.isError && (
        <Alert tone="danger" title="서버 상태를 불러오지 못했습니다.">
          잠시 후 새로고침을 다시 눌러 주세요. 계속 실패하면 관제 채널에 공유해
          주세요.
        </Alert>
      )}

      <Card
        title="서버 상태"
        description={
          health
            ? `마지막 확인 ${formatDateTimeSecond(health.checkedAt)}`
            : "상태를 조회하는 중입니다."
        }
        action={
          <Button
            size="sm"
            leftIcon={<Refresh size={15} />}
            isLoading={isRefreshing}
            onClick={handleRefresh}
          >
            새로고침
          </Button>
        }
      >
        {healthQuery.isLoading || !health ? (
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge tone={HEALTH_STATUS_TONE[health.status]}>
                  {HEALTH_STATUS_LABEL[health.status]}
                </Badge>
                <span className="body-5 text-font-2">
                  {HEALTH_STATUS_DESCRIPTION[health.status]}
                </span>
              </div>

              <div className="mt-1 flex flex-col">
                <SummaryRow
                  label="업타임"
                  value={formatUptime(health.uptimeSeconds)}
                />
                <SummaryRow
                  label="외부 의존성"
                  value={`${health.dependencies.length}개 연결`}
                />
                <SummaryRow
                  label="마지막 확인"
                  value={formatDateTimeSecond(health.checkedAt)}
                />
              </div>
            </div>

            <div className="flex flex-col justify-center gap-5">
              <UsageBar
                label="CPU 사용률"
                value={health.cpuUsage}
                description={`${formatWithCommas(health.cpuCores)}코어`}
              />
              <UsageBar
                label="메모리 사용률"
                value={health.memoryUsage}
                description={`${formatBytes(health.memoryUsedBytes)} / ${formatBytes(health.memoryTotalBytes)} 사용 중`}
              />
              {/*
                힙을 따로 둔다. 머신 메모리에 여유가 있어도 힙이 차면 GC가 돌기
                시작하고, 응답이 느려지는 원인은 그쪽인 경우가 많다.
              */}
              <UsageBar
                label="JVM 힙 사용률"
                value={health.heapUsage}
                description={`${formatBytes(health.heapUsedBytes)} / ${formatBytes(health.heapMaxBytes)} 사용 중`}
              />
            </div>
          </div>
        )}
      </Card>

      <Card title="외부 의존성" description="연결된 저장소·외부 API 상태" noPadding>
        <Table
          columns={dependencyColumns}
          rows={health?.dependencies ?? []}
          getRowKey={(row) => row.name}
          isLoading={healthQuery.isLoading}
          skeletonRows={5}
          emptyTitle="연결된 외부 의존성이 없습니다."
          emptyDescription="서버에 의존성이 등록되면 이 목록에 표시됩니다."
        />
      </Card>

      <ResourceUsageChart metrics={metricsQuery.data ?? []} />
    </>
  );
};

export default ServerStatusBoard;
