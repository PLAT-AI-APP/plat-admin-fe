"use client";

import { useBatchJobListQuery } from "@/api/ops/getBatchJobList";
import { useBatchJobMutation } from "@/api/ops/mutateBatchJob";
import { formatDateTime } from "@/lib/dayjs";
import { openConfirm } from "@/store/useConfirmStore";
import { useHasPermission } from "@/store/useAdminStore";
import type { BatchJob } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import { Refresh } from "@/icons";
import {
  BATCH_RUN_STATUS_LABEL,
  BATCH_RUN_STATUS_TONE,
  describeCron,
} from "../_constants/labels";

interface BatchJobBoardProps {
  /** 잡을 누르면 아래 이력이 그 잡으로 좁혀진다. */
  selectedJobKey: string;
  onSelectJob: (jobKey: string) => void;
}

/**
 * 배치 잡 정의 목록.
 *
 * 잡을 만들거나 지우지 않는다. **원본은 코드에 있는 스케줄러**이고, 여기서는
 * 켜고 끄는 것과 지금 한 번 돌리는 것만 한다. 어드민에서 잡을 만들 수 있게 하면
 * 코드에 없는 배치가 생겨 어디를 봐야 하는지 알 수 없게 된다.
 */
const BatchJobBoard = ({ selectedJobKey, onSelectJob }: BatchJobBoardProps) => {
  const { data, isLoading, isError } = useBatchJobListQuery();
  const { runMutation, toggleMutation } = useBatchJobMutation();

  const canWrite = useHasPermission("batch:write");

  /**
   * 수동 실행은 반드시 확인을 받는다.
   *
   * 스케줄과 **같은 처리를 그대로 다시 돌리는 것**이라 크레딧 소멸 · 파일 파기처럼
   * 되돌릴 수 없는 일이 섞여 있다. 버튼 한 번으로 나가면 안 된다.
   */
  const handleRun = (job: BatchJob) =>
    openConfirm({
      title: `'${job.name}'을(를) 지금 실행할까요?`,
      description: job.description,
      warning:
        "스케줄과 같은 처리가 그대로 실행됩니다. 이미 처리된 대상이 다시 처리될 수 있습니다.",
      confirmText: "지금 실행",
      tone: "danger",
      onConfirm: () => runMutation.mutateAsync(job.jobKey),
    });

  const columns: TableColumn<BatchJob>[] = [
    {
      key: "name",
      header: "잡",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-font-1">{row.name}</span>
          <code className="body-6 text-font-2">{row.jobKey}</code>
        </div>
      ),
    },
    {
      key: "cron",
      header: "주기",
      width: "170px",
      render: (row) => {
        const described = describeCron(row.cronExpression);

        return (
          <div className="flex flex-col">
            <span className="text-font-1">
              {described ?? row.cronExpression}
            </span>
            {described && (
              <code className="body-6 text-font-2">{row.cronExpression}</code>
            )}
          </div>
        );
      },
    },
    {
      key: "lastRun",
      header: "최근 실행",
      width: "190px",
      render: (row) =>
        row.lastRunStatus ? (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={BATCH_RUN_STATUS_TONE[row.lastRunStatus]}>
              {BATCH_RUN_STATUS_LABEL[row.lastRunStatus]}
            </Badge>
            <span className="body-6 text-font-2">
              {formatDateTime(row.lastRunAt)}
            </span>
          </div>
        ) : (
          <span className="text-font-disabled">실행 이력 없음</span>
        ),
    },
    {
      key: "nextRunAt",
      header: "다음 예정",
      width: "170px",
      render: (row) =>
        row.nextRunAt ? (
          <span className="text-font-2">{formatDateTime(row.nextRunAt)}</span>
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "isEnabled",
      header: "스케줄",
      width: "90px",
      align: "center",
      render: (row) => (
        /*
          행 전체가 클릭 대상(잡 선택)이라 조작 컨트롤은 전파를 끊는다.
          그러지 않으면 스케줄을 끄는 동작이 아래 이력 필터까지 함께 바꾼다.
        */
        <span onClick={(event) => event.stopPropagation()}>
          <Switch
            checked={row.isEnabled}
            disabled={!canWrite || toggleMutation.isPending}
            label={`${row.name} 스케줄`}
            onChange={(isEnabled) =>
              toggleMutation.mutate({
                jobKey: row.jobKey,
                name: row.name,
                isEnabled,
              })
            }
          />
        </span>
      ),
    },
    {
      key: "run",
      header: "",
      width: "120px",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Refresh size={14} />}
          disabled={!canWrite || runMutation.isPending}
          onClick={(event) => {
            event.stopPropagation();
            handleRun(row);
          }}
        >
          실행
        </Button>
      ),
    },
  ];

  return (
    <>
      {isError && (
        <Alert tone="danger" title="배치 잡 목록을 불러오지 못했습니다.">
          잠시 후 다시 시도해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <div className="flex flex-col">
            <p className="body-4 font-semibold text-font-1">등록된 배치 잡</p>
            <p className="body-6 text-font-2">
              잡을 누르면 아래 실행 이력이 그 잡으로 좁혀집니다.
            </p>
          </div>

          {selectedJobKey && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectJob("")}
            >
              전체 이력 보기
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          rows={data ?? []}
          getRowKey={(row) => row.jobKey}
          isLoading={isLoading}
          skeletonRows={6}
          onRowClick={(row) => onSelectJob(row.jobKey)}
          emptyTitle="등록된 배치 잡이 없습니다."
        />
      </Card>
    </>
  );
};

export default BatchJobBoard;
