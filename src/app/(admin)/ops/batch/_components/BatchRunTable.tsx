"use client";

import { useState } from "react";
import { useBatchRunListQuery } from "@/api/ops/getBatchRunList";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { cn, formatAdmin } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { BatchJobRun, BatchRunStatus, BatchTrigger } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import { ChevronDown } from "@/icons";
import {
  BATCH_RUN_STATUS_LABEL,
  BATCH_RUN_STATUS_OPTIONS,
  BATCH_RUN_STATUS_TONE,
  BATCH_TRIGGER_LABEL,
  BATCH_TRIGGER_OPTIONS,
  formatDuration,
} from "../_constants/labels";

const CSV_COLUMNS: CsvColumn<BatchJobRun>[] = [
  { header: "잡", value: (row) => row.jobName },
  { header: "상태", value: (row) => BATCH_RUN_STATUS_LABEL[row.status] },
  { header: "트리거", value: (row) => BATCH_TRIGGER_LABEL[row.trigger] },
  { header: "실행자", value: (row) => row.actor ?? "" },
  { header: "시작", value: (row) => formatDateTimeSecond(row.startedAt) },
  { header: "소요", value: (row) => formatDuration(row.durationMs) },
  { header: "처리", value: (row) => String(row.processedCount ?? "") },
  { header: "실패", value: (row) => String(row.failedCount ?? "") },
  { header: "오류", value: (row) => row.errorMessage ?? "" },
  { header: "실행 로그", value: (row) => row.log ?? "" },
];

interface BatchRunTableProps {
  jobKey: string;
  status: string;
  trigger: string;
  page: number;
  onChangeParams: (patch: {
    status?: string;
    trigger?: string;
    page?: number;
  }) => void;
}

/**
 * 배치 실행 이력.
 *
 * 관리자 활동 로그와 컬럼이 하나도 겹치지 않는다. 여기서 답해야 하는 것은
 * "누가 바꿨나"가 아니라 **"제대로 돌았나, 다시 돌려야 하나"** 이기 때문이다.
 */
const BatchRunTable = ({
  jobKey,
  status,
  trigger,
  page,
  onChangeParams,
}: BatchRunTableProps) => {
  const { data, isLoading, isError } = useBatchRunListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    jobKey,
    status: status as BatchRunStatus | "",
    trigger: trigger as BatchTrigger | "",
  });

  /*
    펼친 행은 주소에 싣지 않는다. 목록 조건과 달리 **남에게 공유할 상태가 아니고**,
    스무 개 행의 열림 여부를 주소에 넣으면 주소가 읽을 수 없게 길어진다.
  */
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const rows = data?.content ?? [];

  const toggleKey = (key: string) =>
    setExpandedKeys((keys) =>
      keys.includes(key) ? keys.filter((it) => it !== key) : [...keys, key],
    );

  /*
    현재 화면의 행이 모두 열려 있을 때만 '전체 접기'가 된다.
    하나라도 닫혀 있으면 누르는 사람의 의도는 "다 열어 달라"다.
  */
  const isAllExpanded =
    rows.length > 0 && rows.every((row) => expandedKeys.includes(String(row.runId)));

  const toggleAll = () =>
    setExpandedKeys(isAllExpanded ? [] : rows.map((row) => String(row.runId)));

  const columns: TableColumn<BatchJobRun>[] = [
    {
      /*
        행 전체가 클릭 대상이지만, 표만 보고 펼 수 있다는 것을 알 수는 없다.
        맨 앞에 둔다 — 오른쪽 끝에 두면 표가 가로로 넓어졌을 때 스크롤 밖으로
        밀려서 유일한 표시가 보이지 않는다.
      */
      key: "expand",
      header: "",
      width: "40px",
      align: "center",
      render: (row) => (
        <ChevronDown
          size={16}
          className={cn(
            "inline-block text-font-2 transition-transform",
            expandedKeys.includes(String(row.runId)) && "rotate-180",
          )}
        />
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (row) => (
        <Badge tone={BATCH_RUN_STATUS_TONE[row.status]}>
          {BATCH_RUN_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "jobName",
      header: "잡",
      width: "190px",
      render: (row) => <span className="text-font-1">{row.jobName}</span>,
    },
    {
      key: "trigger",
      header: "트리거",
      width: "150px",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-font-2">
            {BATCH_TRIGGER_LABEL[row.trigger]}
          </span>
          {/* 수동 실행에만 사람이 있다. 누가 눌렀는지가 곧 책임 소재다. */}
          {row.trigger === "MANUAL" && (
            <span className="body-6 text-font-2">
              {formatAdmin(row.actor, row.actorId)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "startedAt",
      header: "시작",
      width: "180px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">
          {formatDateTimeSecond(row.startedAt)}
        </span>
      ),
    },
    {
      key: "durationMs",
      header: "소요",
      width: "100px",
      numeric: true,
      render: (row) => (
        <span className="text-font-1">{formatDuration(row.durationMs)}</span>
      ),
    },
    {
      key: "processedCount",
      header: "처리 / 실패",
      width: "120px",
      numeric: true,
      render: (row) =>
        /*
          아직 도는 중이면 건수가 없다. 0으로 채우면 "0건 처리하고 끝났다"로 읽혀
          실제로는 한창 돌고 있는 잡이 아무 일도 안 한 것처럼 보인다.
        */
        row.processedCount === undefined ? (
          <span className="text-font-disabled">-</span>
        ) : (
          <span className="tabular-nums text-font-1">
            {row.processedCount.toLocaleString()}
            {/* 0건 성공과 실패를 구분하려면 두 수를 나란히 봐야 한다. */}
            <span
              className={row.failedCount ? "text-danger" : "text-font-disabled"}
            >
              {" / "}
              {(row.failedCount ?? 0).toLocaleString()}
            </span>
          </span>
        ),
    },
    {
      key: "errorMessage",
      header: "오류",
      render: (row) =>
        row.errorMessage ? (
          <p className="max-w-90 truncate text-danger">{row.errorMessage}</p>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
  ];

  return (
    <>
      {isError && (
        <Alert tone="danger" title="실행 이력을 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <div className="flex items-center gap-2">
            <p className="body-4 font-semibold text-font-1">실행 이력</p>

            <Button
              size="sm"
              variant="ghost"
              disabled={rows.length === 0}
              onClick={toggleAll}
            >
              {isAllExpanded ? "전체 접기" : "전체 열기"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CsvExportButton
              fileName="배치실행이력"
              rows={rows}
              columns={CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={BATCH_RUN_STATUS_OPTIONS}
              value={status}
              onChange={(event) =>
                onChangeParams({ status: event.target.value })
              }
              selectBoxClassName="w-36"
            />

            <Select
              options={BATCH_TRIGGER_OPTIONS}
              value={trigger}
              onChange={(event) =>
                onChangeParams({ trigger: event.target.value })
              }
              selectBoxClassName="w-36"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => String(row.runId)}
          isLoading={isLoading}
          expandedKeys={expandedKeys}
          onToggleExpand={toggleKey}
          renderExpanded={(row) => (
            <pre className="max-h-80 overflow-auto rounded-field border border-border-main bg-surface px-3.5 py-3 body-6 whitespace-pre-wrap text-font-2 scrollbar-thin">
              {row.log ?? "남은 실행 로그가 없습니다."}
            </pre>
          )}
          emptyTitle="조회된 실행 이력이 없습니다."
          emptyDescription="잡 · 상태 · 트리거 필터를 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => onChangeParams({ page: next })}
        />
      </Card>
    </>
  );
};

export default BatchRunTable;
