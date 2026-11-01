"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useContentReviewCountsQuery,
  useContentReviewListQuery,
} from "@/api/contentReview/getContentReviews";
import {
  BULK_RETRY_MAX,
  useContentReviewBulkRetryMutation,
} from "@/api/contentReview/mutateContentReviewTask";
import { useListParams } from "@/hooks/useListParams";
import { ChevronDown } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  ContentReviewCounts,
  ContentReviewQueueStatus,
  ContentReviewReasonGroup,
  ContentReviewTask,
} from "@/type/contentReview";
import { SERVICE_LANGUAGE_LABEL } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import {
  FINDING_FIELD_LABEL,
  IMAGE_FILE_TYPE_LABEL,
  TARGET_TYPE_LABEL,
  canDecide,
  canRetry,
  formatWaited,
  imageFileTypeLabel,
  isAiFailure,
  isManualDecision,
  manualReasonLabel,
  taskStatusBadge,
  taskTargetImage,
  taskTargetHref,
  taskTitle,
  universeHistoryHref,
} from "../_lib/reviewMeta";
import AttemptLogTable from "./AttemptLogTable";
import ReviewDecisionPanel from "./ReviewDecisionPanel";
import ReviewInputView from "./ReviewInputView";

/** 실패 로그는 작업 상태가 아니라 시도 기록이라 서버 상태 탭과 따로 둔다. */
type ReviewTab = ContentReviewQueueStatus | "FAILURES";

/** 주소에 실리는 목록 조건. 처음 열면 관리자 확인이 필요한 건부터 본다. 정렬은 서버 순서를 따른다. */
const DEFAULT_PARAMS = {
  page: 1,
  status: "MANUAL",
  reasonGroup: "",
};

/** 처리된 건은 처리 시각, 아직 안 끝난 건은 접수 시각을 보여 준다. */
const isFinishedTab = (status: ContentReviewQueueStatus) =>
  status === "APPROVED" || status === "REJECTED";

const countByStatus = (counts: ContentReviewCounts | undefined, status: ContentReviewQueueStatus) => {
  if (!counts) return 0;

  return {
    READY: counts.ready,
    RUNNING: counts.running,
    MANUAL: counts.manual,
    APPROVED: counts.approved,
    REJECTED: counts.rejected,
  }[status];
};

/** 이미지 단독 검수가 아니면 검수된 문구가 있다 */
const hasInputText = (task: ContentReviewTask) =>
  task.input.fields.length > 0 || task.input.texts.length > 0;

/** 쓰기 권한이 있고 이 건에 할 수 있는 판정이 있는가 */
const hasActions = (task: ContentReviewTask, canWrite: boolean) =>
  canWrite && (canDecide(task) || canRetry(task));

/** 반려 사유 · 수정 안내 · 원본 이미지 · 관리자 판정. 행에 다 싣기엔 길어 펼쳐서 본다. */
const ReviewDetail = ({ task, canWrite }: { task: ContentReviewTask; canWrite: boolean }) => {
  const targetImage = taskTargetImage(task);

  return (
    /*
      표는 내용 길이만큼 넓어진다(`min-w-max`). 펼친 내용이 그 너비 계산에 끼면 상세 설정 한 줄 길이만큼
      가로 스크롤이 생기므로, 너비 계산에서는 빠지고(w-0) 실제로는 칸을 채워(min-w-full) 줄바꿈되게 한다.
    */
    <div className="flex w-0 min-w-full flex-col gap-3 px-5 py-4">
      {task.reason ? (
        <div className="flex flex-col gap-1">
          <span className="body-6 text-font-2">AI 판단 사유</span>
          <p className="body-5 whitespace-pre-wrap wrap-anywhere text-font-1">{task.reason}</p>
        </div>
      ) : (
        <p className="body-6 text-font-disabled">AI 판단 사유가 제공되지 않았습니다.</p>
      )}

      {task.findings.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="body-6 text-font-2">수정 안내</span>
          <ul className="flex flex-col gap-1">
            {task.findings.map((finding, index) => (
              <li key={index} className="body-5 flex gap-2 text-font-1">
                <Badge>
                  {SERVICE_LANGUAGE_LABEL[finding.language] ?? finding.language} ·{" "}
                  {FINDING_FIELD_LABEL[finding.field] ?? finding.field}
                </Badge>
                <span>{finding.guide}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasInputText(task) && <ReviewInputView key={`input-${task.taskId}`} input={task.input} />}
      {task.input.images.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="body-6 text-font-2">
            {targetImage ? "검수 대상 이미지" : "검수 당시 첨부 이미지"} (누르면 새 탭에서 크게 봅니다. 주소가 만료되면 새로고침하세요)
          </span>
          <div className="flex flex-wrap gap-2">
            {task.input.images.map((image) => (
              <a
                key={image.fileId}
                href={image.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-24 flex-col gap-1"
              >
                <EntityImage
                  src={image.originalUrl}
                  alt={`${imageFileTypeLabel(image.fileType)} 미리보기`}
                  fileId={image.fileId}
                />
                <span className="caption-3 text-center text-font-2">
                  {IMAGE_FILE_TYPE_LABEL[image.fileType] ?? image.fileType}
                </span>
                <span className="caption-3 text-center font-mono text-font-2">
                  {image.fileId}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="body-6 text-font-2">
        작업 ID <span className="font-mono">{task.taskId}</span> · 시도 {task.attempts}회
        {task.model && ` · ${task.model}`}
        {task.policyVersion !== null && ` · 정책 v${task.policyVersion}`}
      </p>
      {hasActions(task, canWrite) && <ReviewDecisionPanel key={`decision-${task.taskId}`} task={task} />}
    </div>
  );
};

const hasDetail = (task: ContentReviewTask, canWrite: boolean) =>
  !!task.reason ||
  task.findings.length > 0 ||
  hasInputText(task) ||
  task.input.images.length > 0 ||
  hasActions(task, canWrite);

interface ContentReviewManagerProps {
  /** 관제 값의 관리자 확인 건수. 사유 묶음 칩에 쓴다. */
  manualCount?: number;
  manualAiFailureCount?: number;
}

const REASON_GROUPS: { label: string; value: ContentReviewReasonGroup | "" }[] = [
  { label: "전체", value: "" },
  { label: "AI 장애", value: "AI_FAILURE" },
  { label: "AI 판단 보류", value: "AI_HOLD" },
];

const ContentReviewManager = ({ manualCount, manualAiFailureCount }: ContentReviewManagerProps) => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const page = params.page;
  const tab = params.status as ReviewTab;
  const status: ContentReviewQueueStatus = tab === "FAILURES" ? "MANUAL" : tab;
  const reasonGroup = params.reasonGroup as ContentReviewReasonGroup | "";
  const isManualTab = tab === "MANUAL";
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const canWrite = useHasPermission("universe:write");
  const bulkRetry = useContentReviewBulkRetryMutation();

  const { data: counts } = useContentReviewCountsQuery("");
  const reasonGroupCount = (value: ContentReviewReasonGroup | "") => {
    if (manualCount === undefined || manualAiFailureCount === undefined) return undefined;
    if (value === "AI_FAILURE") return manualAiFailureCount;
    if (value === "AI_HOLD") return manualCount - manualAiFailureCount;
    return manualCount;
  };
  // 사유 묶음으로 거르면 상태 건수가 아니라 묶음 건수로 페이지를 나눈다.
  const totalCount =
    isManualTab && reasonGroup
      ? reasonGroupCount(reasonGroup) ?? countByStatus(counts, status)
      : countByStatus(counts, status);
  const listQuery = useContentReviewListQuery({
    status,
    targetType: "",
    reasonGroup,
    page,
    size: DEFAULT_PAGE_SIZE,
  });
  const rows = listQuery.data?.content ?? [];

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
    if (page > lastPage) setParams({ page: lastPage });
  }, [page, setParams, totalCount]);

  /* 조건이 바뀐 렌더에서 바로 비운다. effect 로 비우면 한 프레임 동안 다른 목록의 선택이 남는다. */
  const filterKey = `${page}-${tab}-${reasonGroup}`;
  const [shownFilterKey, setShownFilterKey] = useState(filterKey);
  if (shownFilterKey !== filterKey) {
    setShownFilterKey(filterKey);
    setExpandedKeys([]);
    setSelectedIds([]);
  }

  const tabs: TabItem<ReviewTab>[] = [
    { label: "관리자 확인 필요", value: "MANUAL", count: counts?.manual },
    { label: "실패 로그", value: "FAILURES" },
    { label: "자동 대기", value: "READY", count: counts?.ready },
    { label: "검수 중", value: "RUNNING", count: counts?.running },
    { label: "승인", value: "APPROVED", count: counts?.approved },
    { label: "반려", value: "REJECTED", count: counts?.rejected },
  ];


  const selectableIds = rows.filter(isAiFailure).map((row) => row.taskId);
  const toggleSelected = (taskId: string) =>
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId].slice(0, BULK_RETRY_MAX),
    );

  const handleToggleExpand = (key: string) => {
    const target = rows.find((row) => row.taskId === key);
    if (!target || !hasDetail(target, canWrite)) return;
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const selectColumn: TableColumn<ContentReviewTask> = {
    key: "select",
    header: (
      <input
        type="checkbox"
        aria-label="AI 장애 건 모두 선택"
        className="size-4 accent-brand"
        disabled={!canWrite || selectableIds.length === 0}
        checked={selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))}
        onChange={(event) => setSelectedIds(event.target.checked ? selectableIds.slice(0, BULK_RETRY_MAX) : [])}
      />
    ),
    width: "44px",
    render: (row) =>
      isAiFailure(row) && (
        <input
          type="checkbox"
          aria-label={`${taskTitle(row)} 선택`}
          className="size-4 accent-brand"
          disabled={!canWrite}
          checked={selectedIds.includes(row.taskId)}
          onClick={(event) => event.stopPropagation()}
          onChange={() => toggleSelected(row.taskId)}
        />
      ),
  };

  const historyLink = (row: ContentReviewTask) =>
    row.targetType === "UNIVERSE" && (
      <Link
        href={universeHistoryHref(row.targetId)}
        onClick={(event) => event.stopPropagation()}
        className="inline-flex h-8 items-center rounded-field border border-border-strong px-3 body-5 font-medium text-font-1 transition hover:bg-surface-hover"
      >
        이력
      </Link>
    );

  const manualColumns: TableColumn<ContentReviewTask>[] = [
    {
      key: "reason",
      header: "넘긴 이유",
      render: (row) => (
        <TableCellStack
          primary={<Badge tone={isAiFailure(row) ? "danger" : "warning"}>{manualReasonLabel(row)}</Badge>}
          secondary={
            // 표가 내용 길이만큼 넓어지므로(min-w-max) 한 줄로 자르고 전문은 펼쳐서 본다.
            <span className="block max-w-72 truncate" title={row.reason ?? undefined}>
              {[row.reason, row.reasonCode].filter(Boolean).join(" · ") || undefined}
            </span>
          }
        />
      ),
    },
    {
      key: "waited",
      header: "기다린 시간",
      width: "120px",
      numeric: true,
      render: (row) => {
        const isLong = Date.now() - new Date(row.createdAt).getTime() > 3_600_000;
        return (
          <span className={cn(isLong ? "font-semibold text-danger" : "text-font-1")}>
            {formatWaited(row.createdAt)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "처리",
      width: "170px",
      align: "right",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          {historyLink(row)}
          {hasDetail(row, canWrite) && (
            <Button
              size="sm"
              variant="primary"
              onClick={(event) => {
                event.stopPropagation();
                handleToggleExpand(row.taskId);
              }}
            >
              {expandedKeys.includes(row.taskId) ? "닫기" : "판정하기"}
            </Button>
          )}
        </span>
      ),
    },
  ];

  const statusColumns: TableColumn<ContentReviewTask>[] = [
    {
      key: "time",
      header: isFinishedTab(status) ? "처리" : "접수",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">
          {formatDateTime(isFinishedTab(status) ? row.completedAt ?? row.createdAt : row.createdAt)}
        </span>
      ),
    },
    {
      key: "target",
      header: "대상",
      render: (row) => {
        const href = taskTargetHref(row);
        const title = taskTitle(row);
        const image = taskTargetImage(row);
        return (
          <div className="flex items-center gap-3">
            {image && (
              <EntityImage
                src={image.originalUrl}
                alt={`${imageFileTypeLabel(image.fileType)} 미리보기`}
                fileId={image.fileId}
                className="w-12 shrink-0"
              />
            )}
            <TableCellStack
              primary={
                <span className="flex items-center gap-1.5">
                  <Badge>{TARGET_TYPE_LABEL[row.targetType] ?? row.targetType}</Badge>
                  {href ? (
                    <Link
                      href={href}
                      className="hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </span>
              }
              secondary={<span className="font-mono">{row.targetId}</span>}
            />
          </div>
        );
      },
    },
    {
      key: "status",
      header: "상태",
      width: "170px",
      render: (row) => {
        const badge = taskStatusBadge(row);
        const secondary =
          row.jobStatus === "READY" && row.nextAttemptAt
            ? `${formatDateTime(row.nextAttemptAt)} 이후 실행`
            : row.jobStatus === "RUNNING" && row.leaseExpired
              ? "중단됨 · 재처리 대기"
              : row.imageAdult !== null
                ? row.imageAdult
                  ? "성인 이미지"
                  : "일반 이미지"
                : undefined;
        return (
          <TableCellStack
            primary={
              <span className="flex items-center gap-1.5">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                {isManualDecision(row) && <Badge tone="brand">수동</Badge>}
              </span>
            }
            secondary={secondary}
          />
        );
      },
    },
    {
      key: "reason",
      header: "사유",
      render: (row) =>
        row.reason ? (
          <TableCellStack
            // 행의 사유도 표 너비를 늘리지 않게 폭을 묶는다. 전문은 펼쳐서 본다.
            primary={
              <span className="line-clamp-2 max-w-md whitespace-pre-wrap wrap-anywhere">
                {row.reason}
              </span>
            }
            secondary={row.findings.length > 0 ? `수정 안내 ${row.findings.length}건` : undefined}
          />
        ) : (
          <span className="text-font-disabled">-</span>
        ),
    },
    {
      key: "toggle",
      header: "",
      width: "120px",
      align: "right",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          {historyLink(row)}
          {hasDetail(row, canWrite) && (
            <ChevronDown
              size={16}
              className={cn(
                "text-font-2 transition-transform",
                expandedKeys.includes(row.taskId) && "rotate-180",
              )}
            />
          )}
        </span>
      ),
    },
  ];

  /* 관리자 확인 탭은 접수 시각 대신 넘긴 이유와 기다린 시간을 앞에 둔다. */
  const targetColumn = statusColumns.find((column) => column.key === "target")!;
  const columns = isManualTab ? [selectColumn, targetColumn, ...manualColumns] : statusColumns;

  return (
    <Card
      noPadding
      title="검수 작업"
      description="현재 작업만 보입니다. 대체된 과거 판정은 세계관별 이력에서 확인합니다."
    >
      <div className="px-5">
        <Tabs items={tabs} value={tab} onChange={(next) => setParams({ status: next, page: 1 })} />
      </div>

      {tab === "FAILURES" ? (
        <AttemptLogTable />
      ) : (
        <>
          {isManualTab && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3.5">
              <div role="group" aria-label="넘긴 이유 묶음" className="flex flex-wrap gap-1.5">
                {REASON_GROUPS.map((group) => {
                  const isOn = reasonGroup === group.value;
                  const count = reasonGroupCount(group.value);
                  return (
                    <button
                      key={group.value}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => setParams({ reasonGroup: group.value, page: 1 })}
                      className={cn(
                        "h-8 rounded-full border px-3 body-5 transition",
                        isOn
                          ? "border-brand bg-surface-selected font-semibold text-brand"
                          : "border-border-strong bg-surface font-medium text-font-1 hover:bg-surface-hover",
                      )}
                    >
                      {group.label}
                      {count !== undefined && <span className="ml-1 tabular-nums">{count}</span>}
                    </button>
                  );
                })}
              </div>
              {canWrite && (
                <div className="flex items-center gap-2">
                  <span className="body-5 text-font-2">AI 장애 건만 골라 다시 맡길 수 있습니다</span>
                  <Button
                    variant="primary"
                    disabled={selectedIds.length === 0 || bulkRetry.isPending}
                    isLoading={bulkRetry.isPending}
                    onClick={() => bulkRetry.mutate(selectedIds, { onSuccess: () => setSelectedIds([]) })}
                  >
                    선택 재검수 {selectedIds.length}건
                  </Button>
                </div>
              )}
            </div>
          )}
          <Table
            columns={columns}
            rows={rows}
            isLoading={listQuery.isLoading}
            getRowKey={(row) => row.taskId}
            expandedKeys={expandedKeys}
            onToggleExpand={handleToggleExpand}
            renderExpanded={(row) => <ReviewDetail task={row} canWrite={canWrite} />}
            emptyTitle={isManualTab ? "관리자가 확인할 검수가 없습니다." : "검수 작업이 없습니다."}
          />
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onChange={(next) => setParams({ page: next })}
          />
        </>
      )}
    </Card>
  );
};

export default ContentReviewManager;
