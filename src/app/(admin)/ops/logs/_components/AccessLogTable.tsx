"use client";

import { useState } from "react";
import {
  useAccessLogListQuery,
  type AccessLogStatusClass,
} from "@/api/ops/getAccessLogList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { AccessLog, AccessLogApp } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import AccessLogDetailModal from "./AccessLogDetailModal";
import type { LogParams, SetLogParams } from "./LogManager";
import {
  ACCESS_LOG_APP_OPTIONS,
  ACCESS_LOG_LEVEL_TONE,
  ACCESS_LOG_METHOD_OPTIONS,
  ACCESS_LOG_STATUS_OPTIONS,
  getAccessLogAppLabel,
} from "@/app/(admin)/ops/logs/_constants/logOptions";

/** 경로 뒤에 쿼리를 붙여 한 줄로 보여 준다. 문의는 대개 "어떤 조건으로 불렀나"까지 봐야 풀린다. */
const formatTarget = (log: AccessLog) =>
  log.queryString ? `${log.path}?${log.queryString}` : log.path;

const CSV_COLUMNS: CsvColumn<AccessLog>[] = [
  { header: "시각", value: (row) => formatDateTimeSecond(row.createdAt) },
  { header: "앱", value: (row) => getAccessLogAppLabel(row.app) },
  { header: "메서드", value: (row) => row.method },
  { header: "경로", value: (row) => formatTarget(row) },
  { header: "상태", value: (row) => String(row.status) },
  { header: "소요(ms)", value: (row) => String(row.durationMs) },
  { header: "사용자 ID", value: (row) => row.userId ?? "" },
  { header: "IP", value: (row) => row.remoteIp ?? "" },
  { header: "로그 ID", value: (row) => row.logId },
];

interface AccessLogTableProps {
  params: LogParams;
  setParams: SetLogParams;
}

/**
 * 접근 로그.
 *
 * 관리자 활동이 "누가 무엇을 바꿨나", 시스템 이벤트가 "무엇이 터지고 있나"라면
 * 여기는 **"이 요청이 실제로 어떻게 오갔나"**다. 4xx는 예외가 아니라 시스템
 * 이벤트에 남지 않으므로, "결제가 안 된다" 같은 문의는 여기서만 되짚을 수 있다.
 *
 * 네 앱이 한 테이블에 쌓고 관리자 API 경로에는 `/admin`이 없어서, 앱 필터가
 * 없으면 서비스 API의 `/users/...`와 관리자 API의 `/users/...`가 섞여 보인다.
 */
const AccessLogTable = ({ params, setParams }: AccessLogTableProps) => {
  const { page, keyword, method, userId, startDate, endDate } = params;
  /* 주소는 문자열만 들고 있다. 서버로 나가기 전에 한 번 좁혀 준다. */
  const app = params.app as AccessLogApp | "";
  const status = params.status as AccessLogStatusClass | "";

  const [detailLog, setDetailLog] = useState<AccessLog | null>(null);

  const { data, isLoading, isError } = useAccessLogListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    app,
    method,
    status,
    userId,
    startDate,
    endDate,
  });

  const columns: TableColumn<AccessLog>[] = [
    {
      key: "status",
      header: "상태",
      width: "80px",
      render: (row) => (
        <Badge tone={ACCESS_LOG_LEVEL_TONE[row.level]}>{row.status}</Badge>
      ),
    },
    {
      key: "app",
      header: "앱",
      width: "110px",
      render: (row) => (
        <span className="text-font-2">{getAccessLogAppLabel(row.app)}</span>
      ),
    },
    {
      key: "path",
      header: "요청",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <code className="shrink-0 body-6 font-medium text-font-2">
            {row.method}
          </code>
          <p className="max-w-140 truncate text-font-1">{formatTarget(row)}</p>
        </div>
      ),
    },
    {
      key: "userId",
      header: "사용자",
      width: "180px",
      render: (row) =>
        row.userId ? (
          <code className="body-6 text-font-2">{row.userId}</code>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "durationMs",
      header: "소요",
      width: "90px",
      numeric: true,
      render: (row) => (
        <span className="tabular-nums text-font-2">
          {formatWithCommas(row.durationMs)}ms
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "시각",
      width: "170px",
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
      {userId && (
        <Alert
          tone="info"
          title={`사용자 #${userId}의 요청만 보고 있습니다.`}
          action={
            <button
              type="button"
              onClick={() => setParams({ userId: "" })}
              className="shrink-0 body-5 font-medium underline"
            >
              전체 보기
            </button>
          }
        />
      )}

      {isError && (
        <Alert tone="danger" title="접근 로그를 불러오지 못했습니다.">
          잠시 후 검색 조건을 다시 적용해 주세요. 계속 실패하면 관제 채널에
          공유해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="경로 · 요청 · 응답 본문으로 검색"
          />

          <div className="flex flex-wrap items-center gap-2">
            <CsvExportButton
              fileName="접근로그"
              rows={data?.content ?? []}
              columns={CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={ACCESS_LOG_APP_OPTIONS}
              value={app}
              onChange={(event) => setParams({ app: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              options={ACCESS_LOG_METHOD_OPTIONS}
              value={method}
              onChange={(event) => setParams({ method: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              options={ACCESS_LOG_STATUS_OPTIONS}
              value={status}
              onChange={(event) => setParams({ status: event.target.value })}
              selectBoxClassName="w-40"
            />
          </div>
        </div>

        <div className="border-b border-border-main px-5 py-3">
          <DateRangeFilter
            value={{ startDate, endDate }}
            onChange={(range) => setParams(range)}
          />
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => row.logId}
          isLoading={isLoading}
          onRowClick={setDetailLog}
          emptyTitle="조회된 요청이 없습니다."
          emptyDescription="앱 · 상태 · 기간 필터나 검색어를 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <AccessLogDetailModal
        log={detailLog}
        onClose={() => setDetailLog(null)}
        onFilterUser={(next) => {
          setDetailLog(null);
          setParams({ userId: next });
        }}
      />
    </>
  );
};

export default AccessLogTable;
