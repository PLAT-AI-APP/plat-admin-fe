import { ReactNode } from "react";
import {
  MAX_CONCURRENT_MAX,
  MAX_CONCURRENT_MIN,
  useContentReviewSettingsMutation,
} from "@/api/contentReview/mutateContentReviewSettings";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import type { ContentReviewMonitor } from "@/type/contentReview";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { formatDurationMs, formatWaited } from "../_lib/reviewMeta";

const KpiCard = ({ label, value, children }: { label: string; value: ReactNode; children: ReactNode }) => (
  <Card bodyClassName="p-4">
    <p className="body-5 text-font-2">{label}</p>
    <div className="mt-2 heading-1 font-bold text-font-0 tabular-nums">{value}</div>
    <div className="mt-2.5 flex flex-col gap-1">{children}</div>
  </Card>
);

const Unit = ({ children }: { children: ReactNode }) => (
  <span className="ml-1 body-4 font-medium text-font-2">{children}</span>
);

/** 대기열 구성 막대. 세 갈래가 각각 다른 이유로 기다린다. */
const QUEUE_PARTS = [
  { key: "readyDue", label: "실행 가능", className: "bg-brand" },
  { key: "waitingImage", label: "이미지 대기", className: "bg-info" },
  { key: "retrying", label: "재시도 대기", className: "bg-warning" },
] as const;

/** 동시 검수 한도. −/+ 한 번이 곧 저장이다. 진행 중인 검수는 끊지 않는다. */
const LimitStepper = ({ value }: { value: number }) => {
  const canWrite = useHasPermission("universe:write");
  const mutation = useContentReviewSettingsMutation();
  const change = (next: number) => mutation.mutate({ maxConcurrent: next });
  const buttonClass =
    "size-9 body-2 text-font-1 transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-font-disabled";

  return (
    <div
      role="group"
      aria-label="동시 검수 한도"
      className="flex items-center overflow-hidden rounded-field border border-border-strong"
    >
      <button
        type="button"
        aria-label="한도 줄이기"
        className={buttonClass}
        disabled={!canWrite || mutation.isPending || value <= MAX_CONCURRENT_MIN}
        onClick={() => change(value - 1)}
      >
        −
      </button>
      <span className="min-w-9 border-x border-border-main text-center title-5 leading-9 tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="한도 늘리기"
        className={buttonClass}
        disabled={!canWrite || mutation.isPending || value >= MAX_CONCURRENT_MAX}
        onClick={() => change(value + 1)}
      >
        +
      </button>
    </div>
  );
};

const ReviewKpiRow = ({ monitor }: { monitor: ContentReviewMonitor }) => {
  const { queue, settings, lastHour } = monitor;
  const queueTotal = queue.readyDue + queue.waitingImage + queue.retrying;
  const attempts = lastHour.completed + lastHour.failed;
  const failRate = attempts ? (lastHour.failed / attempts) * 100 : 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
      <KpiCard label="자동 검수 대기열" value={<>{queueTotal}<Unit>건</Unit></>}>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-neutral-bg">
          {QUEUE_PARTS.map((part) => (
            <span
              key={part.key}
              className={part.className}
              style={{ width: queueTotal ? `${(queue[part.key] / queueTotal) * 100}%` : 0 }}
            />
          ))}
        </div>
        <p className="mt-1 flex flex-wrap gap-x-2 body-6 text-font-2">
          {QUEUE_PARTS.map((part) => (
            <span key={part.key} className="inline-flex items-center gap-1">
              <span aria-hidden className={cn("size-2 rounded-full", part.className)} />
              {part.label} {queue[part.key]}
            </span>
          ))}
        </p>
        <p className="body-6 text-font-2">
          가장 오래 기다린 작업{" "}
          <strong className="font-semibold text-font-1">{formatWaited(queue.oldestReadyAt)}</strong>
        </p>
      </KpiCard>

      <KpiCard
        label="실행 중 / 동시 검수 한도"
        value={
          <div className="flex items-center justify-between gap-2">
            <span>
              {monitor.active.length}
              <span className="mx-1 title-2 font-medium text-font-disabled">/</span>
              {settings.maxConcurrent}
            </span>
            <LimitStepper value={settings.maxConcurrent} />
          </div>
        }
      >
        <p className="body-6 text-font-2">
          모든 AI 서버 합산 · {MAX_CONCURRENT_MIN}~{MAX_CONCURRENT_MAX} · 재시작 없이 바로 반영
        </p>
        <p className="body-6 text-font-2">
          마지막 변경 {settings.updatedBy ? `관리자 ${settings.updatedBy} · ` : ""}
          {formatDateTime(settings.updatedAt)}
        </p>
      </KpiCard>

      <KpiCard label="관리자 확인 필요" value={<>{queue.manual}<Unit>건</Unit></>}>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="danger">AI 장애 {queue.manualAiFailure}</Badge>
          <Badge tone="warning">AI 판단 보류 {queue.manual - queue.manualAiFailure}</Badge>
        </div>
        <p className="mt-1 body-6 text-font-2">
          가장 오래 기다린 건{" "}
          <strong className={cn("font-semibold", queue.oldestManualAt ? "text-danger" : "text-font-1")}>
            {formatWaited(queue.oldestManualAt)}
          </strong>
        </p>
      </KpiCard>

      <KpiCard label="최근 1시간 처리" value={<>{lastHour.completed}<Unit>건</Unit></>}>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="body-6 text-font-2">실패율</p>
            <p className={cn("title-5 tabular-nums", failRate >= 5 ? "text-danger" : "text-font-1")}>
              {failRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="body-6 text-font-2">평균 소요</p>
            <p className="title-5 tabular-nums text-font-1">{formatDurationMs(lastHour.avgMs)}</p>
          </div>
          <div>
            <p className="body-6 text-font-2">p95</p>
            <p className="title-5 tabular-nums text-font-1">{formatDurationMs(lastHour.p95Ms)}</p>
          </div>
        </div>
      </KpiCard>
    </div>
  );
};

export default ReviewKpiRow;
