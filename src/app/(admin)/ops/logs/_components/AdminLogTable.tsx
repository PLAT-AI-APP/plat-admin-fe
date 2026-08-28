"use client";

import { useState } from "react";
import { useAdminLogListQuery } from "@/api/ops/getAdminLogList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { formatAdmin } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { AdminAuditLog, AuditResult } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import LogDetailModal from "./LogDetailModal";
import type { LogParams, SetLogParams } from "./LogManager";
import {
  AUDIT_RESULT_LABEL,
  AUDIT_RESULT_OPTIONS,
  AUDIT_RESULT_TONE,
  LOG_DOMAIN_OPTIONS,
  getLogDomainLabel,
} from "../_constants/labels";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const CSV_COLUMNS: CsvColumn<AdminAuditLog>[] = [
  { header: "실행자", value: (row) => formatAdmin(row.actor, row.actorId) },
  { header: "직책", value: (row) => row.roleName ?? "" },
  { header: "도메인", value: (row) => getLogDomainLabel(row.domain) },
  { header: "액션", value: (row) => row.action },
  {
    header: "대상",
    value: (row) =>
      row.targetType ? `${row.targetType} #${row.targetId ?? ""}` : "",
  },
  { header: "결과", value: (row) => AUDIT_RESULT_LABEL[row.result] },
  { header: "메시지", value: (row) => row.message },
  { header: "IP", value: (row) => row.ip ?? "" },
  { header: "일시", value: (row) => formatDateTimeSecond(row.createdAt) },
];

interface AdminLogTableProps {
  params: LogParams;
  setParams: SetLogParams;
}

/**
 * 관리자 활동 로그.
 *
 * 답해야 하는 질문은 "누가 무엇을 어떤 값으로 바꿨나"다. 그래서 결과 · 도메인 ·
 * 실행자로 좁히고, 바뀐 값은 행을 눌러 상세에서 본다.
 */
const AdminLogTable = ({ params, setParams }: AdminLogTableProps) => {
  const { page, keyword, domain, actorId } = params;
  const result = params.result as AuditResult | "";

  const [detailLog, setDetailLog] = useState<AdminAuditLog | null>(null);

  const { data, isLoading, isError } = useAdminLogListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    domain,
    result,
    actorId,
  });

  // 특정 관리자의 활동만 보고 있을 때, 그 사실을 화면에 드러낸다.
  const filteredActorName = actorId
    ? formatAdmin(
        data?.content.find((log) => String(log.actorId) === actorId)?.actor,
        Number(actorId),
      )
    : null;

  const columns: TableColumn<AdminAuditLog>[] = [
    {
      key: "actor",
      header: "실행자",
      width: "160px",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-font-1">
            {formatAdmin(row.actor, row.actorId)}
          </span>
          {/* 지금 직책이 아니라 실행 당시 직책이다. 권한을 되짚을 때 필요하다. */}
          {row.roleName && (
            <span className="body-6 text-font-2">{row.roleName}</span>
          )}
        </div>
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
      key: "result",
      header: "결과",
      width: "100px",
      render: (row) => (
        <Badge tone={AUDIT_RESULT_TONE[row.result]}>
          {AUDIT_RESULT_LABEL[row.result]}
        </Badge>
      ),
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => (
        <p className="max-w-100 truncate text-font-1">{row.message}</p>
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
            placeholder="메시지 · 액션 · 실행자 · 대상으로 검색"
          />

          <div className="flex items-center gap-2">
            <CsvExportButton
              fileName="관리자활동로그"
              rows={data?.content ?? []}
              columns={CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={AUDIT_RESULT_OPTIONS}
              value={result}
              onChange={(event) => setParams({ result: event.target.value })}
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
          emptyTitle="조회된 활동이 없습니다."
          emptyDescription="결과 · 도메인 필터나 검색어를 바꿔서 다시 확인해 보세요."
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

export default AdminLogTable;
