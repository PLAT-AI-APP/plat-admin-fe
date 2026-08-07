"use client";

import { useState } from "react";
import { useLogListQuery } from "@/api/ops/getLogList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { LogLevel, OperationLog } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  LOG_DOMAIN_OPTIONS,
  LOG_LEVEL_LABEL,
  LOG_LEVEL_OPTIONS,
  LOG_LEVEL_TONE,
  getLogDomainLabel,
} from "../_constants/labels";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const LOG_CSV_COLUMNS: CsvColumn<OperationLog>[] = [
  { header: "레벨", value: (row) => LOG_LEVEL_LABEL[row.level] },
  { header: "도메인", value: (row) => getLogDomainLabel(row.domain) },
  { header: "액션", value: (row) => row.action },
  { header: "실행자", value: (row) => row.actor },
  { header: "메시지", value: (row) => row.message },
  { header: "일시", value: (row) => formatDateTimeSecond(row.createdAt) },
];

const LogManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<LogLevel | "">("");
  const [domain, setDomain] = useState("");

  const { data, isLoading, isError } = useLogListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    level,
    domain,
  });

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 항상 1페이지로 되돌린다. */
  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  const handleChangeLevel = (next: LogLevel | "") => {
    setLevel(next);
    setPage(1);
  };

  const handleChangeDomain = (next: string) => {
    setDomain(next);
    setPage(1);
  };

  const columns: TableColumn<OperationLog>[] = [
    {
      key: "level",
      header: "레벨",
      width: "90px",
      render: (row) => (
        <Badge tone={LOG_LEVEL_TONE[row.level]}>
          {LOG_LEVEL_LABEL[row.level]}
        </Badge>
      ),
    },
    {
      key: "domain",
      header: "도메인",
      width: "120px",
      render: (row) => (
        <span className="text-font-2">{getLogDomainLabel(row.domain)}</span>
      ),
    },
    {
      key: "action",
      header: "액션",
      width: "170px",
      render: (row) => <span className="text-font-1">{row.action}</span>,
    },
    {
      key: "actor",
      header: "실행자",
      width: "130px",
      render: (row) => <span className="text-font-2">{row.actor}</span>,
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => (
        <p className="max-w-140 truncate text-font-1">{row.message}</p>
      ),
    },
    {
      key: "createdAt",
      header: "일시",
      width: "180px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">
          {formatDateTimeSecond(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      {isError && (
        <Alert tone="danger" title="로그를 불러오지 못했습니다.">
          잠시 후 검색 조건을 다시 적용해 주세요. 계속 실패하면 관제 채널에
          공유해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="메시지 · 액션 · 실행자로 검색"
          />

          <div className="flex items-center gap-2">
            <CsvExportButton
              fileName="운영로그"
              rows={data?.content ?? []}
              columns={LOG_CSV_COLUMNS}
              disabled={isLoading}
            />
            <Select
              options={LOG_LEVEL_OPTIONS}
              value={level}
              onChange={(event) =>
                handleChangeLevel(event.target.value as LogLevel | "")
              }
              selectBoxClassName="w-36"
            />

            <Select
              options={LOG_DOMAIN_OPTIONS}
              value={domain}
              onChange={(event) => handleChangeDomain(event.target.value)}
              selectBoxClassName="w-44"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.logId)}
          isLoading={isLoading}
          emptyTitle="조회된 로그가 없습니다."
          emptyDescription="레벨 · 도메인 필터나 검색어를 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>
    </>
  );
};

export default LogManager;
