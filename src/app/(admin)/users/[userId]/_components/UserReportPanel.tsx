"use client";

import { useState } from "react";
import { useReportCaseListQuery } from "@/api/report/getReportCaseList";
import { useReporterEntriesQuery } from "@/api/report/getReporterEntries";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas, truncate } from "@/lib/utils";
import {
  REPORT_CASE_STATUS_LABEL,
  REPORT_REASON_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  type ReportCaseItem,
  type ReportEntryItem,
  type ReportTargetType,
} from "@/type/report";
import PermissionGate from "@/components/domain/PermissionGate";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import {
  REPORT_CASE_STATUS_TONE,
  REPORT_COUNT_HIGHLIGHT,
  REPORT_REASON_TONE,
  REPORT_TARGET_TYPE_TONE,
} from "@/constants/reportOptions";
import { USER_DETAIL_PAGE_SIZE } from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

interface UserReportPanelProps {
  userId: string;
}

const targetTypeColumn = <T extends { targetType: ReportTargetType }>(): TableColumn<T> => ({
  key: "targetType",
  header: "대상",
  width: "80px",
  render: (row) => (
    <Badge tone={REPORT_TARGET_TYPE_TONE[row.targetType]}>
      {REPORT_TARGET_TYPE_LABEL[row.targetType]}
    </Badge>
  ),
});

/** 이 유저의 콘텐츠를 대상으로 열린 케이스 */
const RECEIVED_COLUMNS: TableColumn<ReportCaseItem>[] = [
  targetTypeColumn<ReportCaseItem>(),
  {
    key: "target",
    header: "제목 · 발췌",
    render: (row) => (
      <TableCellStack
        primary={
          <span className="body-5">
            {row.targetTitle ? truncate(row.targetTitle, 30) : "(제목 없음)"}
          </span>
        }
        secondary={row.targetExcerpt ? truncate(row.targetExcerpt, 50) : undefined}
      />
    ),
  },
  {
    key: "reportCount",
    header: "신고 수",
    align: "right",
    numeric: true,
    width: "80px",
    render: (row) => (
      <span
        className={cn(
          "font-semibold",
          row.reportCount >= REPORT_COUNT_HIGHLIGHT && "text-danger",
        )}
      >
        {formatWithCommas(row.reportCount)}
      </span>
    ),
  },
  {
    key: "topReason",
    header: "대표 사유",
    width: "100px",
    render: (row) => (
      <Badge tone={REPORT_REASON_TONE[row.topReason]}>
        {REPORT_REASON_LABEL[row.topReason]}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "상태",
    width: "100px",
    render: (row) => (
      <Badge tone={REPORT_CASE_STATUS_TONE[row.status]}>
        {REPORT_CASE_STATUS_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: "lastReportedAt",
    header: "최근 신고",
    align: "right",
    numeric: true,
    width: "150px",
    render: (row) => (
      <span className="body-5 text-font-2">{formatDateTime(row.lastReportedAt)}</span>
    ),
  },
];

/** 이 유저가 넣은 신고 */
const FILED_COLUMNS: TableColumn<ReportEntryItem>[] = [
  targetTypeColumn<ReportEntryItem>(),
  {
    key: "target",
    header: "신고 대상",
    width: "180px",
    render: (row) => (
      <span className="body-5">
        {row.targetTitle ? truncate(row.targetTitle, 20) : "(제목 없음)"}
      </span>
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
        <span className="body-5">{truncate(row.detail, 50)}</span>
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
  {
    key: "caseStatus",
    header: "케이스 상태",
    width: "100px",
    render: (row) => (
      <Badge tone={REPORT_CASE_STATUS_TONE[row.caseStatus]}>
        {REPORT_CASE_STATUS_LABEL[row.caseStatus]}
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "신고일",
    align: "right",
    numeric: true,
    width: "150px",
    render: (row) => (
      <span className="body-5 text-font-2">{formatDateTime(row.createdAt)}</span>
    ),
  },
];

/**
 * 이 유저와 얽힌 신고 이력.
 * 제재 판단에는 "당한 신고"가 먼저 필요하므로 위에 두고, 넣은 신고를 아래에 둔다.
 * 두 표 모두 행을 누르면 그 신고가 묶인 케이스 상세로 간다.
 */
const UserReportPanel = ({ userId }: UserReportPanelProps) => {
  const [receivedPage, setReceivedPage] = useState(1);
  const [filedPage, setFiledPage] = useState(1);

  // 이 유저가 피신고자(콘텐츠 소유자)인 케이스
  const { data: received, isLoading: isReceivedLoading } = useReportCaseListQuery({
    page: receivedPage,
    size: USER_DETAIL_PAGE_SIZE,
    ownerUserId: userId,
    sort: "LAST_REPORTED_DESC",
  });

  const { data: filed, isLoading: isFiledLoading } = useReporterEntriesQuery({
    reporterUserId: userId,
    page: filedPage,
    size: USER_DETAIL_PAGE_SIZE,
  });

  return (
    <PermissionGate required="report:read">
      <div className="flex flex-col gap-4">
        <Card
          title={`신고당한 케이스 ${formatWithCommas(received?.totalCount ?? 0)}건`}
          description="이 유저가 쓴 댓글 · 만든 세계관을 대상으로 열린 신고 케이스입니다. 제재 판단의 근거로 씁니다."
          noPadding
        >
          <Table
            columns={RECEIVED_COLUMNS}
            rows={received?.content ?? []}
            getRowKey={(row) => row.caseId}
            getRowHref={(row) => `/community/reports/${row.caseId}`}
            isLoading={isReceivedLoading}
            skeletonRows={3}
            emptyTitle="신고당한 이력이 없습니다."
            emptyDescription="이 유저의 콘텐츠를 대상으로 열린 신고 케이스가 없습니다."
          />

          <Pagination
            page={receivedPage}
            totalCount={received?.totalCount ?? 0}
            pageSize={USER_DETAIL_PAGE_SIZE}
            onChange={setReceivedPage}
          />
        </Card>

        <Card
          title={`넣은 신고 ${formatWithCommas(filed?.totalCount ?? 0)}건`}
          description="이 유저가 다른 대상을 신고한 이력입니다."
          noPadding
        >
          <Table
            columns={FILED_COLUMNS}
            rows={filed?.content ?? []}
            getRowKey={(row) => row.reportId}
            getRowHref={(row) => `/community/reports/${row.caseId}`}
            isLoading={isFiledLoading}
            skeletonRows={3}
            emptyTitle="넣은 신고가 없습니다."
            emptyDescription="이 유저가 신고를 접수한 적이 없습니다."
          />

          <Pagination
            page={filedPage}
            totalCount={filed?.totalCount ?? 0}
            pageSize={USER_DETAIL_PAGE_SIZE}
            onChange={setFiledPage}
          />
        </Card>
      </div>
    </PermissionGate>
  );
};

export default UserReportPanel;
