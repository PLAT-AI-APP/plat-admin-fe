"use client";

import Link from "next/link";
import { useState } from "react";
import { useReportListQuery } from "@/api/report/getReportList";
import { useReportMutation } from "@/api/report/mutateReport";
import { ExternalLink } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas, truncate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  getReportTargetHref,
  type Report,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "@/type/report";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { TableCellStack, type TableColumn } from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import ReportHandleModal from "./ReportHandleModal";
import {
  REPORT_REASON_FILTER_OPTIONS,
  REPORT_REASON_TONE,
  REPORT_SORT_OPTIONS,
  REPORT_STATUS_TABS,
  REPORT_STATUS_TONE,
  REPORT_TARGET_TYPE_FILTER_OPTIONS,
  REPORT_TARGET_TYPE_TONE,
} from "./reportOptions";

type ReportSort = "RECENT" | "REPORTED";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const REPORT_CSV_COLUMNS: CsvColumn<Report>[] = [
  { header: "ID", value: (row) => row.reportId },
  {
    header: "대상 종류",
    value: (row) => REPORT_TARGET_TYPE_LABEL[row.targetType],
  },
  { header: "대상", value: (row) => row.targetName },
  { header: "대상 ID", value: (row) => row.targetId },
  { header: "신고자", value: (row) => row.reporterNickname },
  { header: "사유", value: (row) => REPORT_REASON_LABEL[row.reason] },
  { header: "신고 내용", value: (row) => row.detail },
  { header: "상태", value: (row) => REPORT_STATUS_LABEL[row.status] },
  { header: "누적 신고", value: (row) => row.targetReportCount },
  { header: "처리자", value: (row) => row.handlerName ?? "" },
  { header: "처리 메모", value: (row) => row.handlerNote ?? "" },
  { header: "신고일", value: (row) => formatDateTime(row.createdAt) },
  { header: "처리일", value: (row) => formatDateTime(row.handledAt) },
];

const ReportManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [targetType, setTargetType] = useState<ReportTargetType | "">("");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [sort, setSort] = useState<ReportSort>("RECENT");

  const [handlingReport, setHandlingReport] = useState<Report | null>(null);

  const { data, isLoading } = useReportListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    status,
    targetType,
    reason,
    sort,
  });

  const { statusMutation } = useReportMutation();

  const reports = data?.content ?? [];

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 1로 되돌린다. */
  const resetPage = () => setPage(1);

  const handleSubmit = (values: {
    status: ReportStatus;
    handlerNote: string;
  }) => {
    if (!handlingReport) return;

    statusMutation.mutate(
      { reportId: handlingReport.reportId, ...values },
      { onSuccess: () => setHandlingReport(null) },
    );
  };

  const columns: TableColumn<Report>[] = [
    {
      key: "target",
      header: "신고 대상",
      width: "220px",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-1">
          <Badge tone={REPORT_TARGET_TYPE_TONE[row.targetType]}>
            {REPORT_TARGET_TYPE_LABEL[row.targetType]}
          </Badge>

          <Link
            href={getReportTargetHref(row)}
            className="flex items-center gap-1 truncate text-[13px] text-font-1 transition hover:text-brand"
          >
            <span className="truncate">{row.targetName}</span>
            <ExternalLink size={11} className="shrink-0" />
          </Link>
        </div>
      ),
    },
    {
      key: "reason",
      header: "사유",
      width: "100px",
      render: (row) => (
        <Badge tone={REPORT_REASON_TONE[row.reason]}>
          {REPORT_REASON_LABEL[row.reason]}
        </Badge>
      ),
    },
    {
      key: "detail",
      header: "신고 내용",
      render: (row) => (
        <TableCellStack
          primary={
            <span className="text-[13px]">{truncate(row.detail, 50)}</span>
          }
          secondary={
            row.targetSnippet ? truncate(row.targetSnippet, 40) : undefined
          }
        />
      ),
    },
    {
      key: "reporter",
      header: "신고자",
      width: "130px",
      render: (row) => (
        <Link
          href={`/users?keyword=${encodeURIComponent(row.reporterNickname)}`}
          className="text-font-2 transition hover:text-brand"
        >
          {truncate(row.reporterNickname, 12)}
        </Link>
      ),
    },
    {
      key: "targetReportCount",
      header: "누적 신고",
      align: "right",
      numeric: true,
      width: "90px",
      render: (row) =>
        row.targetReportCount >= 5 ? (
          <span className="font-semibold text-danger">
            {formatWithCommas(row.targetReportCount)}
          </span>
        ) : (
          formatWithCommas(row.targetReportCount)
        ),
    },
    {
      key: "status",
      header: "처리 상태",
      width: "110px",
      render: (row) => (
        <Badge tone={REPORT_STATUS_TONE[row.status]}>
          {REPORT_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "신고일",
      width: "150px",
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "handler",
      header: "처리자",
      width: "110px",
      render: (row) => (
        <span className="text-font-2">{row.handlerName ?? "-"}</span>
      ),
    },
  ];

  return (
    <>
      <Alert tone="warning" title="MVP 제외 기능">
        현재 운영에서는 Discord로 처리합니다. 화면은 이후 전환을 위해 미리
        구현해 두었습니다.
      </Alert>

      <Card
        title={`신고 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="캐릭터·댓글·유저 신고를 한 화면에서 처리합니다. 행을 클릭하면 처리 창이 열립니다."
        action={
          <CsvExportButton
            fileName="신고"
            rows={reports}
            columns={REPORT_CSV_COLUMNS}
            disabled={isLoading}
          />
        }
        noPadding
      >
        <Tabs
          items={REPORT_STATUS_TABS}
          value={status}
          onChange={(next) => {
            setStatus(next);
            resetPage();
          }}
          className="px-3"
        />

        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => {
              setKeyword(next);
              resetPage();
            }}
            placeholder="대상 · 신고자 · 신고 내용으로 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="대상 필터"
              options={REPORT_TARGET_TYPE_FILTER_OPTIONS}
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as ReportTargetType | "");
                resetPage();
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="신고 사유 필터"
              options={REPORT_REASON_FILTER_OPTIONS}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as ReportReason | "");
                resetPage();
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="정렬"
              options={REPORT_SORT_OPTIONS}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ReportSort);
                resetPage();
              }}
              selectBoxClassName="w-44"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={reports}
          getRowKey={(row) => String(row.reportId)}
          isLoading={isLoading}
          onRowClick={setHandlingReport}
          emptyTitle="조회된 신고가 없습니다."
          emptyDescription="상태 탭이나 검색 조건을 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <ReportHandleModal
        report={handlingReport}
        onClose={() => setHandlingReport(null)}
        onSubmit={handleSubmit}
        isSubmitting={statusMutation.isPending}
      />
    </>
  );
};

export default ReportManager;
