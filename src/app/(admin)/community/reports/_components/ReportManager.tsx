"use client";

import Link from "next/link";
import {
  useReportCaseListQuery,
  useReportCaseStatusCountsQuery,
} from "@/api/report/getReportCaseList";
import { useListParams } from "@/hooks/useListParams";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas, truncate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  REPORT_CASE_STATUS_LABEL,
  REPORT_REASON_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  formatReportUser,
  type ReportCaseItem,
  type ReportCaseSort,
  type ReportCaseStatus,
  type ReportReason,
  type ReportTargetType,
} from "@/type/report";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import {
  REPORT_CASE_SORT_OPTIONS,
  REPORT_CASE_STATUSES,
  REPORT_CASE_STATUS_TONE,
  REPORT_COUNT_HIGHLIGHT,
  REPORT_REASON_FILTER_OPTIONS,
  REPORT_REASON_TONE,
  REPORT_STATUS_ALL,
  REPORT_TARGET_TYPE_FILTER_OPTIONS,
  REPORT_TARGET_TYPE_TONE,
} from "@/constants/reportOptions";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const REPORT_CSV_COLUMNS: CsvColumn<ReportCaseItem>[] = [
  { header: "케이스 ID", value: (row) => row.caseId },
  { header: "대상 종류", value: (row) => REPORT_TARGET_TYPE_LABEL[row.targetType] },
  { header: "대상 ID", value: (row) => row.targetId },
  { header: "대상", value: (row) => row.targetTitle ?? "" },
  { header: "발췌", value: (row) => row.targetExcerpt ?? "" },
  { header: "피신고자", value: (row) => formatReportUser(row.owner) },
  { header: "신고 수", value: (row) => row.reportCount },
  { header: "대표 사유", value: (row) => REPORT_REASON_LABEL[row.topReason] },
  { header: "최초 신고", value: (row) => formatDateTime(row.firstReportedAt) },
  { header: "최근 신고", value: (row) => formatDateTime(row.lastReportedAt) },
  { header: "상태", value: (row) => REPORT_CASE_STATUS_LABEL[row.status] },
  { header: "처리자", value: (row) => row.handlerName ?? "" },
  { header: "처리일", value: (row) => formatDateTime(row.handledAt) },
];

const COLUMNS: TableColumn<ReportCaseItem>[] = [
  {
    key: "targetType",
    header: "대상",
    width: "80px",
    render: (row) => (
      <Badge tone={REPORT_TARGET_TYPE_TONE[row.targetType]}>
        {REPORT_TARGET_TYPE_LABEL[row.targetType]}
      </Badge>
    ),
  },
  {
    key: "target",
    header: "제목 · 발췌",
    render: (row) => (
      <TableCellStack
        primary={
          <span className="body-5 font-medium">
            {row.targetTitle ? truncate(row.targetTitle, 40) : "(제목 없음)"}
          </span>
        }
        secondary={row.targetExcerpt ? truncate(row.targetExcerpt, 60) : undefined}
      />
    ),
  },
  {
    key: "owner",
    header: "피신고자",
    width: "130px",
    render: (row) => (
      // 행 클릭(케이스 상세)과 겹치지 않게 전파를 끊는다.
      <Link
        href={`/users/${row.owner.userId}`}
        onClick={(event) => event.stopPropagation()}
        className="text-font-2 transition hover:text-brand"
      >
        {truncate(formatReportUser(row.owner), 12)}
      </Link>
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
    key: "lastReportedAt",
    header: "최근 신고",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.lastReportedAt)}</span>
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
    key: "handler",
    header: "처리자",
    width: "140px",
    render: (row) =>
      row.handlerName ? (
        <TableCellStack
          primary={<span className="body-5 text-font-2">{row.handlerName}</span>}
          secondary={formatDateTime(row.handledAt)}
        />
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
];

/** 주소에 실리는 목록 조건. 들어오자마자 처리할 것부터 보이도록 대기 · 누적 신고 순이 기본이다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  status: "PENDING",
  targetType: "",
  reason: "",
  sort: "REPORT_COUNT_DESC",
};

/**
 * 신고 케이스 목록.
 *
 * 신고 한 건이 아니라 **대상 하나**가 한 줄이다. 같은 댓글에 열 명이 신고해도 한 번에
 * 판정하므로, 누적 신고가 많은 대상부터 처리하는 것이 기본 순서다.
 */
const ReportManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const statusTab = params.status as ReportCaseStatus | typeof REPORT_STATUS_ALL;
  const targetType = params.targetType as ReportTargetType | "";
  const reason = params.reason as ReportReason | "";
  const sort = params.sort as ReportCaseSort;

  const filters = { keyword, targetType, reason };

  const { data, isLoading, isError, error } = useReportCaseListQuery({
    ...filters,
    page,
    size: DEFAULT_PAGE_SIZE,
    status: statusTab === REPORT_STATUS_ALL ? "" : statusTab,
    sort,
  });
  const { data: counts } = useReportCaseStatusCountsQuery(filters);

  const cases = data?.content ?? [];

  const tabs: TabItem<ReportCaseStatus | typeof REPORT_STATUS_ALL>[] = [
    ...REPORT_CASE_STATUSES.map((status) => ({
      label: REPORT_CASE_STATUS_LABEL[status],
      value: status,
      count: counts?.[status],
    })),
    {
      label: "전체",
      value: REPORT_STATUS_ALL,
      count: counts
        ? REPORT_CASE_STATUSES.reduce((sum, status) => sum + counts[status], 0)
        : undefined,
    },
  ];

  return (
    <Card
      title={`신고 케이스 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="대상 하나에 접수된 신고를 한 케이스로 묶었습니다. 행을 누르면 상세에서 판정 · 조치합니다."
      action={
        <CsvExportButton
          fileName="신고 케이스"
          rows={cases}
          columns={REPORT_CSV_COLUMNS}
          disabled={isLoading}
        />
      }
      noPadding
    >
      <Tabs
        items={tabs}
        value={statusTab}
        onChange={(next) => setParams({ status: next })}
        className="px-3"
      />

      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <SearchInput
          value={keyword}
          onSearch={(next) => setParams({ keyword: next })}
          placeholder="대상 제목 · 내용 · 피신고자 닉네임으로 검색"
        />

        <div className="flex items-center gap-2">
          <Select
            aria-label="대상 필터"
            options={REPORT_TARGET_TYPE_FILTER_OPTIONS}
            value={targetType}
            onChange={(event) => setParams({ targetType: event.target.value })}
            selectBoxClassName="w-32"
          />

          <Select
            aria-label="신고 사유 필터"
            options={REPORT_REASON_FILTER_OPTIONS}
            value={reason}
            onChange={(event) => setParams({ reason: event.target.value })}
            selectBoxClassName="w-32"
          />

          <Select
            aria-label="정렬"
            options={REPORT_CASE_SORT_OPTIONS}
            value={sort}
            onChange={(event) => setParams({ sort: event.target.value })}
            selectBoxClassName="w-44"
          />
        </div>
      </div>

      {isError ? (
        <EmptyState
          title="신고 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={cases}
          getRowKey={(row) => row.caseId}
          getRowHref={(row) => `/community/reports/${row.caseId}`}
          isLoading={isLoading}
          emptyTitle="조회된 신고 케이스가 없습니다."
          emptyDescription="상태 탭이나 검색 조건을 바꿔서 다시 확인해 보세요."
        />
      )}

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={DEFAULT_PAGE_SIZE}
        onChange={(next) => setParams({ page: next })}
      />
    </Card>
  );
};

export default ReportManager;
