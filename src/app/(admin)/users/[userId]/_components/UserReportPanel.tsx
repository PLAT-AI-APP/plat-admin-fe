"use client";

import Link from "next/link";
import { useState } from "react";
import { useReportListQuery } from "@/api/report/getReportList";
import { ExternalLink } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas, truncate } from "@/lib/utils";
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  getReportTargetHref,
  type Report,
} from "@/type/report";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  REPORT_REASON_TONE,
  REPORT_STATUS_TONE,
  REPORT_TARGET_TYPE_TONE,
} from "../../../community/reports/_components/reportOptions";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserReportPanelProps {
  userId: number;
}

/** 두 표가 공유하는 컬럼 (사유 · 신고 내용 · 상태 · 신고일) */
const commonColumns: TableColumn<Report>[] = [
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
      <span className="text-[13px]">{truncate(row.detail, 50)}</span>
    ),
  },
  {
    key: "status",
    header: "처리 상태",
    width: "100px",
    render: (row) => (
      <Badge tone={REPORT_STATUS_TONE[row.status]}>
        {REPORT_STATUS_LABEL[row.status]}
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
      <span className="text-[13px] text-font-2">
        {formatDateTime(row.createdAt)}
      </span>
    ),
  },
];

/**
 * 이 유저와 얽힌 신고 이력.
 * 제재 판단에는 "당한 신고"가 먼저 필요하므로 위에 두고, 접수한 신고를 아래에 둔다.
 */
const UserReportPanel = ({ userId }: UserReportPanelProps) => {
  const [receivedPage, setReceivedPage] = useState(1);
  const [filedPage, setFiledPage] = useState(1);

  // 유저 본인이 신고당한 건. 대상 타입이 USER인 신고만 센다.
  const { data: received, isLoading: isReceivedLoading } = useReportListQuery({
    page: receivedPage,
    size: USER_DETAIL_PAGE_SIZE,
    targetType: "USER",
    targetId: userId,
  });

  const { data: filed, isLoading: isFiledLoading } = useReportListQuery({
    page: filedPage,
    size: USER_DETAIL_PAGE_SIZE,
    reporterId: userId,
  });

  const filedColumns: TableColumn<Report>[] = [
    {
      key: "targetType",
      header: "분류",
      width: "90px",
      render: (row) => (
        <Badge tone={REPORT_TARGET_TYPE_TONE[row.targetType]}>
          {REPORT_TARGET_TYPE_LABEL[row.targetType]}
        </Badge>
      ),
    },
    {
      key: "target",
      header: "신고 대상",
      width: "160px",
      render: (row) => (
        <Link
          href={getReportTargetHref(row)}
          className="flex min-w-0 items-center gap-1 text-[13px] text-font-1 transition hover:text-brand"
        >
          <span className="truncate">{row.targetName}</span>
          <ExternalLink size={11} className="shrink-0" />
        </Link>
      ),
    },
    ...commonColumns,
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={`신고당한 이력 ${formatWithCommas(received?.totalCount ?? 0)}건`}
        description="이 유저 계정을 대상으로 접수된 신고입니다. 제재 판단의 근거로 씁니다."
        noPadding
      >
        <Table
          columns={commonColumns}
          rows={received?.content ?? []}
          getRowKey={(row) => String(row.reportId)}
          isLoading={isReceivedLoading}
          skeletonRows={3}
          emptyTitle="신고당한 이력이 없습니다."
          emptyDescription="이 유저를 대상으로 접수된 신고가 없습니다."
        />

        <Pagination
          page={receivedPage}
          totalCount={received?.totalCount ?? 0}
          pageSize={USER_DETAIL_PAGE_SIZE}
          onChange={setReceivedPage}
        />
      </Card>

      <Card
        title={`접수한 신고 ${formatWithCommas(filed?.totalCount ?? 0)}건`}
        description="이 유저가 다른 대상을 신고한 이력입니다."
        noPadding
      >
        <Table
          columns={filedColumns}
          rows={filed?.content ?? []}
          getRowKey={(row) => String(row.reportId)}
          isLoading={isFiledLoading}
          skeletonRows={3}
          emptyTitle="접수한 신고가 없습니다."
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
  );
};

export default UserReportPanel;
