"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useContentReviewMonitorQuery } from "@/api/contentReview/getContentReviews";
import { useContentReviewSettingsMutation } from "@/api/contentReview/mutateContentReviewSettings";
import { contentReviewQueryKeys } from "@/api/contentReview/queryKeys";
import {
  AUTO_REFRESH_LABEL,
  AUTO_REFRESH_SECONDS,
  useAutoRefresh,
  type AutoRefreshSeconds,
} from "@/hooks/useAutoRefresh";
import { formatDateTime, formatFromNow } from "@/lib/dayjs";
import { useHasPermission } from "@/store/useAdminStore";
import type { ContentReviewMonitorRange } from "@/type/contentReview";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { universeHistoryHref } from "../_lib/reviewMeta";
import ContentReviewManager from "./ContentReviewManager";
import ExecutionSlots from "./ExecutionSlots";
import ReviewKpiRow from "./ReviewKpiRow";
import ThroughputChart from "./ThroughputChart";
import WorkerStatusBar from "./WorkerStatusBar";

const AUTO_REFRESH_OPTIONS = AUTO_REFRESH_SECONDS.map((seconds) => ({
  label: AUTO_REFRESH_LABEL[seconds],
  value: String(seconds),
}));

/** 세계관 ID 로 이력 화면을 바로 연다. 목록에서 찾기 어려운 지난 건을 볼 때 쓴다. */
const UniverseHistorySearch = () => {
  const router = useRouter();
  const [universeId, setUniverseId] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = universeId.trim();
    if (/^\d+$/.test(id)) router.push(universeHistoryHref(id));
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <Input
        type="search"
        inputMode="numeric"
        aria-label="세계관 검수 이력 찾기"
        placeholder="세계관 ID로 이력 찾기"
        value={universeId}
        onChange={(event) => setUniverseId(event.target.value)}
        inputBoxClassName="w-52"
      />
      <Button type="submit" variant="secondary" disabled={!/^\d+$/.test(universeId.trim())}>
        이력 보기
      </Button>
    </form>
  );
};

/**
 * 검수 관제. 워커 신호 · 대기열 · 실행 슬롯 · 처리량을 위에, 사람이 처리할 작업을 아래에 둔다.
 * 자동 새로고침은 관제 값과 목록을 함께 다시 받는다. 판정 중 펼친 행은 그대로 둔다.
 */
const ReviewMonitorBoard = () => {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<ContentReviewMonitorRange>("1h");
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<AutoRefreshSeconds>(5);
  const canWrite = useHasPermission("universe:write");
  const settingsMutation = useContentReviewSettingsMutation();
  const monitorQuery = useContentReviewMonitorQuery(range);
  const monitor = monitorQuery.data;

  const { secondsLeft } = useAutoRefresh(autoRefreshSeconds, () =>
    queryClient.invalidateQueries({ queryKey: contentReviewQueryKeys.all() }),
  );

  /* 자동 멈춤 남은 시간은 1초마다 줄어야 한다. 끝나면 서버가 다시 시작하므로 그때 한 번 새로 받는다. */
  const [now, setNow] = useState(() => Date.now());
  const pausedUntil = monitor?.settings.pausedUntil ? new Date(monitor.settings.pausedUntil).getTime() : 0;
  const breakerLeftMs = Math.max(0, pausedUntil - now);
  useEffect(() => {
    if (!pausedUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [pausedUntil]);

  const isPaused = monitor?.settings.paused ?? false;
  const isBreaker = !isPaused && breakerLeftMs > 0;
  const breakerLeft = `${Math.floor(breakerLeftMs / 60_000)}분 ${Math.floor((breakerLeftMs % 60_000) / 1000)}초`;

  return (
    <>
      <PageHeader
        title="검수 관제"
        description="AI 검수 워커 상태와 대기열, 실행 슬롯, 실패를 한눈에 보고 관리자 판정이 필요한 건을 처리합니다."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <UniverseHistorySearch />
            <Select
              options={AUTO_REFRESH_OPTIONS}
              value={String(autoRefreshSeconds)}
              onChange={(event) => setAutoRefreshSeconds(Number(event.target.value) as AutoRefreshSeconds)}
              aria-label="자동 새로고침"
              selectBoxClassName="w-40"
            />
            {canWrite && monitor && (
              <Button
                variant={isPaused ? "primary" : "secondary"}
                isLoading={settingsMutation.isPending}
                disabled={settingsMutation.isPending}
                onClick={() => settingsMutation.mutate({ paused: !isPaused })}
              >
                {isPaused ? "자동 검수 재개" : "자동 검수 일시정지"}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        {isBreaker && (
          <Alert
            tone="danger"
            title={`AI 제공사 응답 실패가 이어져 자동 검수를 멈췄습니다 · ${breakerLeft} 뒤 자동 재개`}
            action={
              canWrite && (
                <Button variant="secondary" onClick={() => settingsMutation.mutate({ paused: false })}>
                  지금 재개
                </Button>
              )
            }
          >
            멈춘 동안 작업의 시도 횟수는 줄지 않습니다. 급한 건은 아래 [관리자 확인 필요]에서 직접 승인할 수 있고, 원인은
            [실패 로그]에서 봅니다.
          </Alert>
        )}
        {isPaused && monitor && (
          <Alert
            tone="warning"
            title={`관리자가 자동 검수를 일시정지했습니다 · ${
              monitor.settings.updatedBy ? `관리자 ${monitor.settings.updatedBy}, ` : ""
            }${formatDateTime(monitor.settings.updatedAt)}`}
          >
            새 작업은 집지 않고 실행 중인 작업만 끝까지 처리합니다. 재개할 때까지 유지됩니다(
            {formatFromNow(monitor.settings.updatedAt)}부터).
          </Alert>
        )}

        {monitor ? (
          <>
            <WorkerStatusBar workers={monitor.workers} secondsLeft={secondsLeft} />
            <ReviewKpiRow monitor={monitor} />
            <div className="flex flex-wrap items-stretch gap-4">
              <ExecutionSlots
                active={monitor.active}
                limit={monitor.settings.maxConcurrent}
                slowMs={monitor.lastHour.p95Ms}
                stoppedReason={
                  isPaused
                    ? "일시정지 — 새 작업을 집지 않습니다"
                    : isBreaker
                      ? "자동 검수 멈춤 — 재개되면 채웁니다"
                      : null
                }
              />
              <ThroughputChart
                series={monitor.series}
                range={range}
                onRangeChange={setRange}
                isLoading={monitorQuery.isFetching && monitor.series.length === 0}
              />
            </div>
          </>
        ) : (
          <Skeleton className="h-96 w-full rounded-card" />
        )}

        <ContentReviewManager
          manualCount={monitor?.queue.manual}
          manualAiFailureCount={monitor?.queue.manualAiFailure}
        />
      </div>
    </>
  );
};

export default ReviewMonitorBoard;
