"use client";

import { useState } from "react";
import { useLedgerListQuery } from "@/api/billing/getLedgerList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { cn, formatCredit, formatCurrency, formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { LedgerEntry, LedgerType } from "@/type/billing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import LedgerSummaryCards from "./LedgerSummaryCards";
import { LEDGER_TYPE_FILTER_OPTIONS, LEDGER_TYPE_LABEL, LEDGER_TYPE_TONE } from "./ledgerOptions";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const LEDGER_CSV_COLUMNS: CsvColumn<LedgerEntry>[] = [
  { header: "유형", value: (row) => LEDGER_TYPE_LABEL[row.type] },
  { header: "유저", value: (row) => row.userNickname },
  { header: "유저 ID", value: (row) => row.userId },
  { header: "금액(원)", value: (row) => row.amount },
  { header: "크레딧 증감", value: (row) => row.creditDelta },
  { header: "상품명", value: (row) => row.productName ?? "" },
  { header: "메모", value: (row) => row.memo },
  { header: "일시", value: (row) => formatDateTimeSecond(row.createdAt) },
];

const LedgerManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<LedgerType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useLedgerListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    type,
    startDate,
    endDate,
  });

  const entries = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleChangeType = (nextType: LedgerType | "") => {
    setType(nextType);
    setPage(1);
  };

  /** 기간이 바뀌면 이전 페이지 번호가 의미를 잃으므로 1로 되돌린다. */
  const handleChangeDateRange = (range: {
    startDate: string;
    endDate: string;
  }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
  };

  const columns: TableColumn<LedgerEntry>[] = [
    {
      key: "type",
      header: "유형",
      width: "100px",
      render: (entry) => (
        <Badge tone={LEDGER_TYPE_TONE[entry.type]}>
          {LEDGER_TYPE_LABEL[entry.type]}
        </Badge>
      ),
    },
    {
      key: "user",
      header: "유저",
      width: "170px",
      render: (entry) => (
        <TableCellStack
          primary={entry.userNickname}
          secondary={`#${entry.userId}`}
        />
      ),
    },
    {
      key: "amount",
      header: "금액",
      width: "130px",
      align: "right",
      numeric: true,
      render: (entry) =>
        entry.amount === 0 ? (
          <span className="text-font-disabled">-</span>
        ) : (
          <span className="font-medium">{formatCurrency(entry.amount)}</span>
        ),
    },
    {
      key: "creditDelta",
      header: "크레딧 증감",
      width: "140px",
      align: "right",
      numeric: true,
      render: (entry) =>
        entry.creditDelta === 0 ? (
          <span className="text-font-disabled">-</span>
        ) : (
          <span
            className={cn(
              "font-semibold",
              entry.creditDelta > 0 ? "text-success" : "text-danger",
            )}
          >
            {entry.creditDelta > 0 ? "+" : "-"}
            {formatCredit(Math.abs(entry.creditDelta))}
          </span>
        ),
    },
    {
      key: "productName",
      header: "상품명",
      width: "150px",
      render: (entry) =>
        entry.productName ? (
          entry.productName
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "memo",
      header: "메모",
      render: (entry) => <p className="max-w-100 text-font-2">{entry.memo}</p>,
    },
    {
      key: "createdAt",
      header: "일시",
      width: "170px",
      numeric: true,
      render: (entry) => (
        <span className="text-font-2">
          {formatDateTimeSecond(entry.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <LedgerSummaryCards />

      <Card
        title={`장부 ${formatWithCommas(totalCount)}건`}
        description="결제·충전·사용·환불·수동 조정이 모두 한 흐름으로 기록됩니다."
        action={
          <CsvExportButton
            fileName="결제장부"
            rows={entries}
            columns={LEDGER_CSV_COLUMNS}
            disabled={isLoading}
          />
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="닉네임, 유저 ID, 메모, 상품명 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="장부 유형 필터"
              options={LEDGER_TYPE_FILTER_OPTIONS}
              value={type}
              onChange={(event) =>
                handleChangeType(event.target.value as LedgerType | "")
              }
              selectBoxClassName="w-36"
            />

            {/* 프리셋으로 대부분의 조회를 끝내고, 필요할 때만 날짜를 직접 고른다. */}
            <DateRangeFilter
              value={{ startDate, endDate }}
              onChange={handleChangeDateRange}
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={entries}
          getRowKey={(entry) => String(entry.ledgerId)}
          isLoading={isLoading}
          skeletonRows={8}
          emptyTitle="조회된 장부 기록이 없습니다."
          emptyDescription="기간이나 유형 필터를 넓혀 다시 조회해 보세요."
        />

        {totalCount > 0 && (
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </Card>
    </>
  );
};

export default LedgerManager;
