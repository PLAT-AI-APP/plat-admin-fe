"use client";

import Link from "next/link";
import { useState } from "react";
import { useContentReviewAttemptsQuery } from "@/api/contentReview/getContentReviews";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { ContentReviewAttempt } from "@/type/contentReview";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import {
  TARGET_TYPE_LABEL,
  attemptErrorLabel,
  formatDurationMs,
  universeHistoryHref,
} from "../_lib/reviewMeta";

const columns: TableColumn<ContentReviewAttempt>[] = [
  {
    key: "time",
    header: "시각",
    width: "170px",
    numeric: true,
    render: (row) => <span className="text-font-2">{formatDateTimeSecond(row.startedAt)}</span>,
  },
  {
    key: "target",
    header: "대상",
    render: (row) => {
      const title = row.title ?? `${TARGET_TYPE_LABEL[row.targetType]} ${row.targetId}`;
      return (
        <TableCellStack
          primary={
            row.targetType === "UNIVERSE" ? (
              <Link href={universeHistoryHref(row.targetId)} className="hover:underline">
                {title}
              </Link>
            ) : (
              title
            )
          }
          secondary={`${TARGET_TYPE_LABEL[row.targetType]} · 작업 ${row.taskId}`}
        />
      );
    },
  },
  {
    key: "error",
    header: "오류",
    render: (row) => (
      <TableCellStack
        primary={<Badge tone="danger">{attemptErrorLabel(row.errorCode)}</Badge>}
        secondary={<span className="font-mono">{row.errorCode ?? "-"}</span>}
      />
    ),
  },
  { key: "attempt", header: "시도", width: "72px", numeric: true, render: (row) => `${row.attempt}/3` },
  { key: "duration", header: "소요", width: "96px", numeric: true, render: (row) => formatDurationMs(row.durationMs) },
  {
    key: "instance",
    header: "인스턴스 · 모델",
    render: (row) => (
      <span className="text-font-2">
        <span className="font-mono">{row.instanceId}</span>
        {row.model && ` · ${row.model}`}
      </span>
    ),
  },
];

/** AI 호출이 실패한 시도. 3회 실패하면 작업은 관리자 확인 필요로 넘어간다. */
const AttemptLogTable = () => {
  const [page, setPage] = useState(1);
  const query = useContentReviewAttemptsQuery({ outcome: "FAILED", page, size: DEFAULT_PAGE_SIZE });
  const hasNext = query.data?.page.hasNext ?? false;

  return (
    <>
      <p className="px-5 py-3.5 body-5 text-font-2">
        AI 호출이 실패한 시도를 최근순으로 보여 줍니다. 3회 실패하면 [관리자 확인 필요]로 넘어갑니다. 30일 보관.
      </p>
      <Table
        columns={columns}
        rows={query.data?.content ?? []}
        isLoading={query.isLoading}
        getRowKey={(row) => row.attemptId}
        emptyTitle="실패한 시도가 없습니다."
      />
      <div className="flex items-center justify-end gap-1.5 border-t border-border-main px-5 py-3">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
          이전
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => setPage(page + 1)}>
          다음
        </Button>
      </div>
    </>
  );
};

export default AttemptLogTable;
