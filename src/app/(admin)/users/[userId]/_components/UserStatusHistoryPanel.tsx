"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserStatusHistoriesQuery } from "@/api/user/userStatusHistory";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { USER_STATUS_SOURCE_LABEL, type UserStatusHistory } from "@/type/user";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import { USER_STATUS_LABEL, USER_STATUS_TONE } from "@/constants/userOptions";
import { USER_DETAIL_PAGE_SIZE } from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

interface UserStatusHistoryPanelProps {
  userId: string;
}

const COLUMNS: TableColumn<UserStatusHistory>[] = [
  {
    key: "createdAt",
    header: "일시",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
    ),
  },
  {
    key: "status",
    header: "상태",
    width: "100px",
    render: (row) => (
      <Badge tone={USER_STATUS_TONE[row.status]}>
        {USER_STATUS_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: "reason",
    header: "사유",
    render: (row) =>
      row.reason ? (
        <span className="body-5 whitespace-pre-wrap">{row.reason}</span>
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
  {
    key: "endedAt",
    header: "만료",
    width: "150px",
    numeric: true,
    render: (row) =>
      row.endedAt ? (
        <span className="text-font-2">{formatDateTime(row.endedAt)}</span>
      ) : row.status === "SUSPENDED" || row.status === "BANNED" ? (
        <span className="text-font-2">기한 없음</span>
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
  {
    key: "source",
    header: "주체",
    width: "180px",
    render: (row) => (
      <TableCellStack
        primary={USER_STATUS_SOURCE_LABEL[row.source]}
        secondary={
          row.reportCaseId ? (
            <Link
              href={`/community/reports/${row.reportCaseId}`}
              className="transition hover:text-brand"
            >
              신고 케이스 #{row.reportCaseId}
            </Link>
          ) : (
            (row.adminName ?? undefined)
          )
        }
      />
    ),
  },
  {
    key: "adminName",
    header: "운영자",
    width: "120px",
    render: (row) =>
      row.adminName ? (
        <span className="text-font-2">{row.adminName}</span>
      ) : (
        <span className="text-font-disabled">-</span>
      ),
  },
];

/**
 * 제재 이력.
 *
 * 정지 · 해제 · 탈퇴가 누가 어떤 경로로 했는지와 함께 남는다. 신고 처리로 바뀐 줄은 그 케이스로 이어진다.
 * 문의 대응 때 "왜 정지됐나요"에 답하는 근거다.
 */
const UserStatusHistoryPanel = ({ userId }: UserStatusHistoryPanelProps) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserStatusHistoriesQuery({
    userId,
    page,
    size: USER_DETAIL_PAGE_SIZE,
  });

  return (
    <Card
      title={`제재 이력 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="유저 관리 · 신고 처리 · 정지 만료 자동 해제 · 본인 탈퇴로 바뀐 상태를 최근 순으로 보여 줍니다."
      noPadding
    >
      <Table
        columns={COLUMNS}
        rows={data?.content ?? []}
        getRowKey={(row) => row.historyId}
        isLoading={isLoading}
        skeletonRows={3}
        emptyTitle="상태가 바뀐 이력이 없습니다."
        emptyDescription="가입 뒤 한 번도 정지 · 해제되지 않은 계정입니다."
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={USER_DETAIL_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default UserStatusHistoryPanel;
