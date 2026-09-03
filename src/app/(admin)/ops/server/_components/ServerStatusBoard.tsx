"use client";

import { useState } from "react";
import { useServerHealthQuery } from "@/api/ops/getServerHealth";
import {
  useServerMetricsQuery,
  type MetricRange,
} from "@/api/ops/getServerMetrics";
import { showAppToast, showErrorToast } from "@/lib/toast";
import { formatBytes } from "@/lib/utils";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";
import CpuDetailCard from "./CpuDetailCard";
import DependencyCard from "./DependencyCard";
import MemoryDetailCard from "./MemoryDetailCard";
import MetricTile from "./MetricTile";
import ResourceUsageChart from "./ResourceUsageChart";
import ServerOverviewCard from "./ServerOverviewCard";
import {
  DANGER_THRESHOLD,
  WARNING_THRESHOLD,
} from "../_constants/serverStatus";
import {
  useAutoRefresh,
  type AutoRefreshSeconds,
} from "../_hooks/useAutoRefresh";

/** 임계치를 넘은 지표를 한 줄로 모은다. 카드를 다 훑기 전에 먼저 보여야 한다. */
const collectWarnings = (
  entries: { label: string; value: number }[],
): string[] =>
  entries
    .filter((entry) => entry.value >= WARNING_THRESHOLD)
    .map(
      (entry) =>
        `${entry.label} ${entry.value.toFixed(1)}%${
          entry.value >= DANGER_THRESHOLD ? " (위험)" : ""
        }`,
    );

const ServerStatusBoard = () => {
  const [range, setRange] = useState<MetricRange>("24h");
  const [autoRefreshSeconds, setAutoRefreshSeconds] =
    useState<AutoRefreshSeconds>(0);

  const healthQuery = useServerHealthQuery();
  const metricsQuery = useServerMetricsQuery(range);

  const health = healthQuery.data;
  const metrics = metricsQuery.data ?? [];
  const isRefreshing = healthQuery.isFetching || metricsQuery.isFetching;

  /** 자동 새로고침은 조용히 다시 부른다 — 5초마다 성공 토스트가 뜨면 화면을 쓸 수 없다. */
  const { secondsLeft } = useAutoRefresh(autoRefreshSeconds, () => {
    void healthQuery.refetch();
    void metricsQuery.refetch();
  });

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

  if (healthQuery.isError) {
    return (
      <Alert tone="danger" title="서버 상태를 불러오지 못했습니다.">
        잠시 후 새로고침을 다시 눌러 주세요. 계속 실패하면 관제 채널에 공유해
        주세요.
      </Alert>
    );
  }

  if (healthQuery.isLoading || !health) {
    return (
      <>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  /*
   * 대표 디스크는 루트(`/`)다. 마운트를 줄줄이 늘어놓으면 어느 것이 "이 서버의 디스크"인지
   * 오히려 흐려진다 — 컨테이너에서는 호스트를 빌려 온 마운트까지 섞여 들어온다.
   * 루트가 없는 환경(있어선 안 되지만)에서는 가장 큰 볼륨을 대신 쓴다.
   */
  const rootDisk =
    health.disks.find((disk) => disk.mountPoint === "/") ??
    [...health.disks].sort((a, b) => b.totalBytes - a.totalBytes)[0];
  const warnings = collectWarnings([
    { label: "CPU", value: health.cpu.systemUsage },
    { label: "메모리", value: health.memory.usage },
    { label: "JVM 힙", value: health.jvm.heapUsage },
    ...health.disks.map((disk) => ({
      label: `디스크 ${disk.mountPoint}`,
      value: disk.usage,
    })),
  ]);

  return (
    <>
      {warnings.length > 0 && (
        <Alert tone="warning" title="임계치를 넘은 지표가 있습니다.">
          {warnings.join(" · ")} — 무엇이 차지하고 있는지 확인해 주세요.
        </Alert>
      )}

      <ServerOverviewCard
        health={health}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        autoRefreshSeconds={autoRefreshSeconds}
        onAutoRefreshChange={setAutoRefreshSeconds}
        secondsLeft={secondsLeft}
      />

      {/* 상단 요약. 각 칸을 누르면 아래 상세 카드로 이동한다. */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricTile
          label={`CPU ${health.cpu.cores}코어`}
          value={health.cpu.systemUsage}
          amount={`${((health.cpu.systemUsage / 100) * health.cpu.cores).toFixed(1)}코어 사용`}
          trend={metrics.map((point) => point.cpuUsage)}
          targetId="server-cpu"
        />
        <MetricTile
          label="메모리"
          value={health.memory.usage}
          amount={`${formatBytes(health.memory.usedBytes)} / ${formatBytes(health.memory.totalBytes)}`}
          trend={metrics.map((point) => point.memoryUsage)}
          targetId="server-memory"
        />
        <MetricTile
          label="JVM 힙"
          value={health.jvm.heapUsage}
          amount={`${formatBytes(health.jvm.heapUsedBytes)} / ${formatBytes(health.jvm.heapCommittedBytes)}`}
          trend={metrics.map((point) => point.heapUsage)}
          targetId="server-trend"
        />
        <MetricTile
          label="디스크"
          value={rootDisk?.usage ?? 0}
          fallbackValue={rootDisk ? undefined : "-"}
          amount={
            rootDisk
              ? `${formatBytes(rootDisk.usedBytes)} / ${formatBytes(rootDisk.totalBytes)}`
              : "읽을 수 없음"
          }
        />
      </div>

      <CpuDetailCard cpu={health.cpu} />

      <MemoryDetailCard
        memory={health.memory}
        processes={health.processes}
      />

      <ResourceUsageChart
        metrics={metrics}
        range={range}
        onRangeChange={setRange}
        isLoading={metricsQuery.isLoading}
      />

      <DependencyCard
        dependencies={health.dependencies}
        isLoading={healthQuery.isLoading}
      />
    </>
  );
};

export default ServerStatusBoard;
