"use client";

import {
  useEarningAccountListQuery,
  useEarningAccountTotalsQuery,
} from "@/api/earning/getEarningAccountList";
import { useListParams } from "@/hooks/useListParams";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { EarningAccountRow, EarningAccountStatus } from "@/type/earning";
import SummaryTiles from "@/components/earning/SummaryTiles";
import { formatPoint } from "@/components/earning/earningFormat";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";

const COLUMNS: TableColumn<EarningAccountRow>[] = [
  {
    key: "creator",
    header: "제작자",
    width: "200px",
    render: (row) => (
      <TableCellStack
        primary={
          <span className="flex items-center gap-1.5">
            {row.nickname ?? "-"}
            {row.status === "FROZEN" && <Badge tone="danger">동결</Badge>}
          </span>
        }
        secondary={<span className="font-mono">{row.userId}</span>}
      />
    ),
  },
  {
    key: "available",
    header: "교환 가능",
    align: "right",
    numeric: true,
    render: (row) => formatPoint(row.available),
  },
  {
    key: "accrued30d",
    header: "30일 적립",
    align: "right",
    numeric: true,
    render: (row) => formatPoint(row.accrued30d),
  },
  {
    key: "chatters",
    header: "유료 대화 사용자 (30일)",
    align: "right",
    numeric: true,
    render: (row) => `${formatWithCommas(row.paidChatters30d)}명`,
  },
  {
    key: "total",
    header: "누적 적립 / 교환",
    align: "right",
    numeric: true,
    render: (row) => (
      <TableCellStack primary={formatPoint(row.totalAccrued)} secondary={formatPoint(row.totalRedeemed)} />
    ),
  },
  {
    key: "lastAccruedAt",
    header: "마지막 적립",
    width: "140px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{row.lastAccruedAt ? formatDateTime(row.lastAccruedAt) : "-"}</span>
    ),
  },
];

const TABS: TabItem<EarningAccountStatus | "">[] = [
  { label: "전체", value: "" },
  { label: "동결", value: "FROZEN" },
];

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = { page: 1, keyword: "", status: "" };

const CreatorEarningList = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const status = params.status as EarningAccountStatus | "";

  const { data, isLoading } = useEarningAccountListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword: keyword || undefined,
    status,
  });
  const { data: totals } = useEarningAccountTotalsQuery();

  return (
    <div className="flex flex-col gap-5">
      <SummaryTiles
        tiles={[
          { label: "교환 가능 합계", value: formatPoint(totals?.available ?? 0), hint: "지급 의무가 있는 포인트" },
          { label: "30일 적립", value: formatPoint(totals?.accrued30d ?? 0) },
        ]}
      />

      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <Tabs items={TABS} value={status} onChange={(next) => setParams({ status: next })} />
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="닉네임 · 유저 ID"
            boxClassName="w-64"
          />
        </div>
        <Table
          columns={COLUMNS}
          rows={data?.content ?? []}
          isLoading={isLoading}
          getRowKey={(row) => row.accountId}
          getRowHref={(row) => `/earnings/creators/${row.accountId}`}
          emptyTitle="조건에 맞는 제작자가 없습니다."
        />
        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>
    </div>
  );
};

export default CreatorEarningList;
