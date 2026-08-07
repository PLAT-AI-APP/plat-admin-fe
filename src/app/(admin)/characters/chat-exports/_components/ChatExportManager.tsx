"use client";

import { useState } from "react";
import { useChatExportJobListQuery } from "@/api/character/getChatExportJobList";
import { useChatExportMutation } from "@/api/character/mutateChatExport";
import { Download } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import type { ChatExportSchema } from "@/schema/chatExport.schema";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { ChatExportJob, ChatExportStatus } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import {
  EXPORT_STATUS_FILTER_OPTIONS,
  EXPORT_STATUS_LABEL,
  EXPORT_STATUS_TONE,
} from "../../_constants/character";
import ChatExportRequestModal from "./ChatExportRequestModal";

const ChatExportManager = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ChatExportStatus | "">("");
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const { data, isLoading } = useChatExportJobListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    status,
  });
  const { createMutation } = useChatExportMutation();

  const handleSubmit = (values: ChatExportSchema) => {
    createMutation.mutate(values, {
      onSuccess: () => setIsRequestOpen(false),
    });
  };

  /** 목업 환경에서는 실제 파일이 없으므로 안내만 남긴다. */
  const handleDownload = (job: ChatExportJob) => {
    showAppToast("info", "목업 환경에서는 파일을 내려받을 수 없습니다.", {
      description: `'${job.targetName}' 작업 결과는 스토리지 연동 후 제공됩니다.`,
    });
  };

  const columns: TableColumn<ChatExportJob>[] = [
    {
      key: "target",
      header: "대상",
      width: "200px",
      render: (row) => (
        <TableCellStack
          primary={row.targetName}
          secondary={`캐릭터 #${row.targetId}`}
        />
      ),
    },
    {
      key: "period",
      header: "추출 기간",
      width: "220px",
      render: (row) => (
        <span className="text-[13px] text-font-2 tabular-nums">
          {formatDate(row.startDate)} ~ {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      width: "110px",
      render: (row) => (
        <Badge tone={EXPORT_STATUS_TONE[row.status]}>
          {EXPORT_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "rowCount",
      header: "행 수",
      align: "right",
      width: "110px",
      numeric: true,
      render: (row) =>
        row.rowCount === undefined ? (
          <span className="text-[13px] text-font-disabled">-</span>
        ) : (
          formatWithCommas(row.rowCount)
        ),
    },
    {
      key: "requestedBy",
      header: "요청자",
      align: "center",
      width: "100px",
      render: (row) => (
        <span className="text-[13px] text-font-2">{row.requestedBy}</span>
      ),
    },
    {
      key: "createdAt",
      header: "생성일",
      align: "right",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-[13px] text-font-2">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      align: "center",
      render: (row) =>
        row.status === "DONE" ? (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={15} />}
            onClick={() => handleDownload(row)}
          >
            다운로드
          </Button>
        ) : (
          <span className="text-[13px] text-font-disabled">-</span>
        ),
    },
  ];

  return (
    <>
      <Alert tone="info">
        내보내기는 비동기 배치로 처리됩니다. 요청 후 상태가 &apos;완료&apos;로
        바뀌면 목록에서 파일을 내려받을 수 있습니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <Select
            options={EXPORT_STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ChatExportStatus | "");
              setPage(1);
            }}
            selectBoxClassName="w-40"
            aria-label="작업 상태 필터"
          />

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={15} />}
            onClick={() => setIsRequestOpen(true)}
          >
            내보내기 요청
          </Button>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.jobId)}
          isLoading={isLoading}
          emptyTitle="내보내기 작업이 없습니다."
          emptyDescription="확인이 필요한 캐릭터와 기간을 골라 첫 작업을 요청해 보세요."
          emptyAction={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={15} />}
              onClick={() => setIsRequestOpen(true)}
            >
              내보내기 요청
            </Button>
          }
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <ChatExportRequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
};

export default ChatExportManager;
