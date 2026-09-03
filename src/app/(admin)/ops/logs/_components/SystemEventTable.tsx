"use client";

import { useSystemEventListQuery } from "@/api/ops/getSystemEventList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond, formatFromNow } from "@/lib/dayjs";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  SystemEventLevel,
  SystemEventLog,
  SystemEventSource,
} from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import type { LogParams, SetLogParams } from "./LogManager";
import {
  SYSTEM_EVENT_LEVEL_LABEL,
  SYSTEM_EVENT_LEVEL_OPTIONS,
  SYSTEM_EVENT_LEVEL_TONE,
  SYSTEM_EVENT_SOURCE_OPTIONS,
  getSystemEventSourceLabel,
} from "../_constants/labels";

const CSV_COLUMNS: CsvColumn<SystemEventLog>[] = [
  { header: "레벨", value: (row) => SYSTEM_EVENT_LEVEL_LABEL[row.level] },
  { header: "발생원", value: (row) => getSystemEventSourceLabel(row.source) },
  { header: "메시지", value: (row) => row.message },
  { header: "발생 횟수", value: (row) => String(row.occurrenceCount) },
  { header: "최초 발생", value: (row) => formatDateTimeSecond(row.firstOccurredAt) },
  { header: "최근 발생", value: (row) => formatDateTimeSecond(row.lastOccurredAt) },
  { header: "traceId", value: (row) => row.traceId ?? "" },
];

interface SystemEventTableProps {
  params: LogParams;
  setParams: SetLogParams;
}

/**
 * 시스템 이벤트.
 *
 * 원본 로그가 아니라 **묶인 요약**을 본다. 같은 오류가 200번 났을 때 필요한 것은
 * 200줄이 아니라 "언제부터 몇 번"이고, 원본을 봐야 하면 `traceId`로 관제 도구에서
 * 찾는다. 어드민이 로그 전문을 들고 있으려 하는 순간 보존 비용과 검색 성능이
 * 어드민의 문제가 된다.
 */
const SystemEventTable = ({ params, setParams }: SystemEventTableProps) => {
  const { page, keyword } = params;
  /* 주소는 문자열만 들고 있다. 서버로 나가기 전에 한 번 좁혀 준다. */
  const level = params.level as SystemEventLevel | "";
  const source = params.source as SystemEventSource | "";

  const { data, isLoading, isError } = useSystemEventListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    level,
    source,
  });

  const columns: TableColumn<SystemEventLog>[] = [
    {
      key: "level",
      header: "레벨",
      width: "90px",
      render: (row) => (
        <Badge tone={SYSTEM_EVENT_LEVEL_TONE[row.level]}>
          {SYSTEM_EVENT_LEVEL_LABEL[row.level]}
        </Badge>
      ),
    },
    {
      key: "source",
      header: "발생원",
      width: "130px",
      render: (row) => (
        <span className="text-font-2">
          {getSystemEventSourceLabel(row.source)}
        </span>
      ),
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => (
        <div className="flex flex-col">
          <p className="max-w-140 truncate text-font-1">{row.message}</p>
          {/* 원본은 관제 도구에 있다. 이 값으로 찾는다. */}
          {row.traceId && (
            <code className="body-6 text-font-2">{row.traceId}</code>
          )}
        </div>
      ),
    },
    {
      key: "occurrenceCount",
      header: "발생",
      width: "110px",
      numeric: true,
      render: (row) => (
        <span className="tabular-nums text-font-1">
          {row.occurrenceCount.toLocaleString()}회
        </span>
      ),
    },
    {
      key: "lastOccurredAt",
      header: "최근 발생",
      width: "190px",
      numeric: true,
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="text-font-1">{formatFromNow(row.lastOccurredAt)}</span>
          <span className="body-6 text-font-2">
            {formatDateTimeSecond(row.lastOccurredAt)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      {isError && (
        <Alert tone="danger" title="시스템 이벤트를 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요. 계속 실패하면 관제 채널에 공유해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="메시지 · traceId로 검색"
          />

          <div className="flex items-center gap-2">
            <CsvExportButton
              fileName="시스템이벤트"
              rows={data?.content ?? []}
              columns={CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={SYSTEM_EVENT_LEVEL_OPTIONS}
              value={level}
              onChange={(event) => setParams({ level: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              options={SYSTEM_EVENT_SOURCE_OPTIONS}
              value={source}
              onChange={(event) => setParams({ source: event.target.value })}
              selectBoxClassName="w-44"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.eventId)}
          isLoading={isLoading}
          emptyTitle="조회된 이벤트가 없습니다."
          emptyDescription="조치가 필요한 경고 · 오류만 모읍니다. 조용한 것이 정상입니다."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>
    </>
  );
};

export default SystemEventTable;
