"use client";

import Link from "next/link";
import { useState } from "react";
import { useReportCaseEntriesQuery } from "@/api/report/getReportCaseEntries";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import {
  REPORT_REASON_LABEL,
  formatReportUser,
  type ReportEntryItem,
} from "@/type/report";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import { REPORT_REASON_TONE } from "@/constants/reportOptions";
import ReportSnapshotView from "./snapshot/ReportSnapshotView";

interface ReportEntryPanelProps {
  caseId: string;
}

const ENTRY_PAGE_SIZE = 10;

const COLUMNS: TableColumn<ReportEntryItem>[] = [
  {
    key: "createdAt",
    header: "신고 시각",
    width: "150px",
    numeric: true,
    render: (row) => <span className="text-font-2">{formatDateTime(row.createdAt)}</span>,
  },
  {
    key: "reporter",
    header: "신고자",
    width: "140px",
    render: (row) => (
      // 행 클릭은 펼치기라 전파를 끊는다.
      <Link
        href={`/users/${row.reporter.userId}`}
        onClick={(event) => event.stopPropagation()}
        className="text-font-1 transition hover:text-brand"
      >
        {formatReportUser(row.reporter)}
      </Link>
    ),
  },
  {
    key: "reason",
    header: "사유",
    width: "100px",
    render: (row) => (
      <Badge tone={REPORT_REASON_TONE[row.reason]}>{REPORT_REASON_LABEL[row.reason]}</Badge>
    ),
  },
  {
    key: "detail",
    header: "상세",
    render: (row) =>
      row.detail ? (
        <span className="line-clamp-2 body-5 whitespace-pre-line">{row.detail}</span>
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
];

/**
 * 케이스에 묶인 개별 신고.
 *
 * 대상 스냅샷은 신고마다 따로 남는다. 작성자가 중간에 글을 고쳤으면 신고마다 본 내용이
 * 다르므로, 행을 펼치면 **그 신고 시점**의 스냅샷을 보여 준다.
 */
const ReportEntryPanel = ({ caseId }: ReportEntryPanelProps) => {
  const [page, setPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const { data, isLoading, isError, error } = useReportCaseEntriesQuery({
    caseId,
    page,
    size: ENTRY_PAGE_SIZE,
  });

  const toggleExpand = (key: string) =>
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );

  return (
    <Card
      title={`개별 신고 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="최근 신고부터 보여 줍니다. 행을 누르면 그 신고 시점의 대상 내용을 펼칩니다."
      noPadding
    >
      <Table
        columns={COLUMNS}
        rows={data?.content ?? []}
        getRowKey={(row) => row.reportId}
        isLoading={isLoading}
        skeletonRows={3}
        renderExpanded={(row) => (
          <div className="rounded-field border border-border-main bg-surface p-4">
            <ReportSnapshotView snapshot={row.snapshot} />
          </div>
        )}
        expandedKeys={expandedKeys}
        onToggleExpand={toggleExpand}
        emptyTitle={isError ? "개별 신고를 불러오지 못했습니다." : "개별 신고가 없습니다."}
        emptyDescription={isError ? error?.message : undefined}
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={ENTRY_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default ReportEntryPanel;
