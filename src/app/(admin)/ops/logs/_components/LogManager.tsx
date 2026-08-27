"use client";

import { useState } from "react";
import { useLogListQuery } from "@/api/ops/getLogList";
import { useListParams } from "@/hooks/useListParams";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { formatAdmin } from "@/lib/utils";
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
import LogDetailModal from "./LogDetailModal";
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
  { header: "실행자", value: (row) => formatAdmin(row.actor, row.actorId) },
  { header: "메시지", value: (row) => row.message },
  { header: "일시", value: (row) => formatDateTimeSecond(row.createdAt) },
];

/** 주소에 실리는 목록 조건. 관리자 관리에서 `?actorId=`를 달고 넘어온다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  level: "",
  domain: "",
  actorId: "",
};

const LogManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, domain, actorId } = params;
  const level = params.level as LogLevel | "";

  const [detailLog, setDetailLog] = useState<OperationLog | null>(null);

  const { data, isLoading, isError } = useLogListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    level,
    domain,
    actorId,
  });

  // 특정 관리자의 활동만 보고 있을 때, 그 사실을 화면에 드러낸다.
  const filteredActorName = actorId
    ? formatAdmin(
        data?.content.find((log) => String(log.actorId) === actorId)?.actor,
        Number(actorId),
      )
    : null;

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
      render: (row) => (
        <span className="text-font-2">{formatAdmin(row.actor, row.actorId)}</span>
      ),
    },
    {
      key: "target",
      header: "대상",
      width: "150px",
      render: (row) =>
        row.targetType ? (
          <span className="text-font-2">
            {row.targetType}
            {row.targetId && (
              <span className="tabular-nums"> #{row.targetId}</span>
            )}
          </span>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => (
        <p className="max-w-120 truncate text-font-1">{row.message}</p>
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
      {filteredActorName && (
        <Alert
          tone="info"
          title={`'${filteredActorName}' 관리자의 활동만 보고 있습니다.`}
          action={
            <button
              type="button"
              onClick={() => setParams({ actorId: "" })}
              className="shrink-0 body-5 font-medium underline"
            >
              전체 보기
            </button>
          }
        />
      )}

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
            onSearch={(next) => setParams({ keyword: next })}
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
              onChange={(event) => setParams({ level: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              options={LOG_DOMAIN_OPTIONS}
              value={domain}
              onChange={(event) => setParams({ domain: event.target.value })}
              selectBoxClassName="w-44"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.logId)}
          isLoading={isLoading}
          onRowClick={setDetailLog}
          emptyTitle="조회된 로그가 없습니다."
          emptyDescription="레벨 · 도메인 필터나 검색어를 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />
    </>
  );
};

export default LogManager;
