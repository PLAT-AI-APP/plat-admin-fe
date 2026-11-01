"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ContentReviewActiveExecution } from "@/type/contentReview";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import { TARGET_TYPE_LABEL, formatElapsed, universeHistoryHref } from "../_lib/reviewMeta";

interface ExecutionSlotsProps {
  active: ContentReviewActiveExecution[];
  limit: number;
  /** 최근 1시간 p95. 이보다 오래 걸리면 경고색. 표본이 없으면 15초 */
  slowMs: number | null;
  /** 슬롯이 비어 있는 이유 */
  stoppedReason: string | null;
}

/** 막대 끝을 30초로 둔다. 대부분 이 안에 끝나고, 넘기면 꽉 찬 막대로 눈에 띈다. */
const BAR_FULL_MS = 30_000;

/**
 * 실행 슬롯. 한도만큼 칸을 그리고 칸마다 지금 AI 를 부르는 작업을 싣는다.
 * 한도를 낮춘 직후에는 실행 중인 작업이 한도보다 많을 수 있다 — 그 칸은 끝나면 비운다.
 */
const ExecutionSlots = ({ active, limit, slowMs, stoppedReason }: ExecutionSlotsProps) => {
  const [now, setNow] = useState(() => Date.now());
  const slowLimit = slowMs ?? 15_000;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const slotCount = Math.max(limit, active.length);

  return (
    <Card
      className="min-w-0 flex-[1_1_520px]"
      title="실행 슬롯"
      description="한 건이 끝나면 가장 오래 기다린 작업이 바로 빈 칸을 채웁니다. 5분을 넘긴 실행은 슬롯을 놓습니다."
      action={
        <span className="title-6 tabular-nums text-brand">
          {active.length} / {limit} 사용
        </span>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {Array.from({ length: slotCount }, (_, index) => {
          const execution = active[index];

          if (!execution) {
            return (
              <div
                key={`empty-${index}`}
                className="flex min-h-33 flex-col items-center justify-center gap-1 rounded-field border-[1.5px] border-dashed border-border-strong p-3 text-center text-font-2"
              >
                <span className="body-6 font-semibold">슬롯 {index + 1} · 비어 있음</span>
                <span className="body-6">{stoppedReason ?? "실행 가능한 작업이 없습니다"}</span>
              </div>
            );
          }

          const elapsedMs = now - new Date(execution.startedAt).getTime();
          const isOver = index >= limit;
          const isSlow = elapsedMs > slowLimit;
          const title = execution.title ?? `${TARGET_TYPE_LABEL[execution.targetType]} ${execution.targetId}`;

          return (
            <article
              key={`${execution.taskId}-${execution.attempt}`}
              className={cn(
                "flex min-h-33 flex-col gap-3 rounded-field border p-3.5",
                isOver ? "border-warning bg-warning-bg" : "border-border-main bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="body-6 font-semibold text-font-2">슬롯 {index + 1}</span>
                <Badge tone={isOver || isSlow ? "warning" : "success"}>
                  {isOver ? "한도 초과 · 끝나면 비움" : isSlow ? "오래 걸림" : "실행 중"}
                </Badge>
              </div>
              <div className="flex items-center gap-2.5">
                {execution.thumbnailUrl ? (
                  <EntityImage src={execution.thumbnailUrl} alt="" className="w-9 shrink-0" />
                ) : (
                  <span aria-hidden className="size-9 shrink-0 rounded-chip bg-subtle" />
                )}
                <div className="min-w-0">
                  {execution.targetType === "UNIVERSE" ? (
                    <Link
                      href={universeHistoryHref(execution.targetId)}
                      className="block truncate title-6 text-font-1 hover:underline"
                    >
                      {title}
                    </Link>
                  ) : (
                    <p className="truncate title-6 text-font-1">{title}</p>
                  )}
                  <p className="body-6 text-font-2">
                    {TARGET_TYPE_LABEL[execution.targetType]} · 시도 {execution.attempt}/3
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between body-6 text-font-2">
                  <span className="truncate font-mono">{execution.instanceId}</span>
                  <span className="font-semibold tabular-nums text-font-1">
                    {formatElapsed(execution.startedAt, now)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-bg">
                  <span
                    className={cn("block h-full rounded-full", isSlow ? "bg-warning" : "bg-brand")}
                    style={{ width: `${Math.min(100, (elapsedMs / BAR_FULL_MS) * 100)}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
};

export default ExecutionSlots;
