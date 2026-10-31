"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useContentReviewCountsQuery,
  useContentReviewListQuery,
} from "@/api/contentReview/getContentReviews";
import { useListParams } from "@/hooks/useListParams";
import { ChevronDown } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  ContentReviewCounts,
  ContentReviewQueueStatus,
  ContentReviewTargetType,
  ContentReviewTask,
} from "@/type/contentReview";
import { SERVICE_LANGUAGE_LABEL } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import Pagination from "@/components/ui/Pagination";
import Select, { type SelectOption } from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import {
  FINDING_FIELD_LABEL,
  IMAGE_FILE_TYPE_LABEL,
  TARGET_TYPE_LABEL,
  TARGET_TYPE_OPTIONS,
  canDecide,
  canRetry,
  imageFileTypeLabel,
  isManualDecision,
  taskStatusBadge,
  taskTargetImage,
  taskTargetHref,
  taskTitle,
} from "../_lib/reviewMeta";
import ReviewDecisionPanel from "./ReviewDecisionPanel";
import ReviewInputView from "./ReviewInputView";

/** 주소에 실리는 목록 조건. 처음 열면 관리자 확인이 필요한 건부터 본다. */
type ReviewSortOrder = "LATEST" | "OLDEST";

const DEFAULT_PARAMS = {
  page: 1,
  status: "MANUAL",
  targetType: "",
  order: "LATEST" as ReviewSortOrder,
};

const REVIEW_SORT_OPTIONS: SelectOption<ReviewSortOrder>[] = [
  { label: "최신순", value: "LATEST" },
  { label: "오래된 순", value: "OLDEST" },
];

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
      {hasInputText(task) && <ReviewInputView key={task.taskId} input={task.input} />}
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
      {hasActions(task, canWrite) && <ReviewDecisionPanel key={task.taskId} task={task} />}
    </div>
  );
};

const hasDetail = (task: ContentReviewTask, canWrite: boolean) =>
  !!task.reason ||
  task.findings.length > 0 ||
  hasInputText(task) ||
  task.input.images.length > 0 ||
  hasActions(task, canWrite);

const ContentReviewManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const page = params.page;
  const status = params.status as ContentReviewQueueStatus;
  const targetType = params.targetType as ContentReviewTargetType | "";
  const order = params.order as ReviewSortOrder;
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const canWrite = useHasPermission("universe:write");

  const { data: counts } = useContentReviewCountsQuery(targetType);
  const totalCount = countByStatus(counts, status);
  const listQuery = useContentReviewListQuery({
    status,
    targetType,
    page,
    size: DEFAULT_PAGE_SIZE,
  });
  const rows = useMemo(() => {
    const tasks = listQuery.data?.content ?? [];
    const getSortTime = (task: ContentReviewTask) =>
      isFinishedTab(status) ? task.completedAt ?? task.createdAt : task.createdAt;

    return [...tasks].sort((left, right) => {
      const difference = new Date(getSortTime(right)).getTime() - new Date(getSortTime(left)).getTime();
      return order === "LATEST" ? difference : -difference;
    });
  }, [listQuery.data, order, status]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
    if (page > lastPage) setParams({ page: lastPage });
  }, [page, setParams, totalCount]);

  useEffect(() => {
    setExpandedKeys([]);
  }, [page, status, targetType]);

  const tabs: TabItem<ContentReviewQueueStatus>[] = [
    { label: "관리자 확인 필요", value: "MANUAL", count: counts?.manual },
    { label: "반려", value: "REJECTED", count: counts?.rejected },
    { label: "자동 검수 대기", value: "READY", count: counts?.ready },
    { label: "검수 중", value: "RUNNING", count: counts?.running },
    { label: "승인", value: "APPROVED", count: counts?.approved },
  ];

  const handleToggleExpand = (key: string) => {
    const target = rows.find((row) => row.taskId === key);
    if (!target || !hasDetail(target, canWrite)) return;
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const columns: TableColumn<ContentReviewTask>[] = [
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
      width: "48px",
      align: "right",
      render: (row) =>
        hasDetail(row, canWrite) && (
          <ChevronDown
            size={16}
            className={cn(
              "text-font-2 transition-transform",
              expandedKeys.includes(row.taskId) && "rotate-180",
            )}
          />
        ),
    },
  ];

  return (
    <Card noPadding>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <Tabs items={tabs} value={status} onChange={(next) => setParams({ status: next })} />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={TARGET_TYPE_OPTIONS}
            value={targetType}
            onChange={(event) => setParams({ targetType: event.target.value })}
            aria-label="검수 대상"
            selectBoxClassName="w-40"
          />
          <Select
            options={REVIEW_SORT_OPTIONS}
            value={order}
            onChange={(event) => setParams({ order: event.target.value as ReviewSortOrder })}
            aria-label="검수 정렬"
            selectBoxClassName="w-28"
          />
        </div>
      </div>
      <Table
        columns={columns}
        rows={rows}
        isLoading={listQuery.isLoading}
        getRowKey={(row) => row.taskId}
        expandedKeys={expandedKeys}
        onToggleExpand={handleToggleExpand}
        renderExpanded={(row) => <ReviewDetail task={row} canWrite={canWrite} />}
        emptyTitle={status === "MANUAL" ? "관리자가 확인할 검수가 없습니다." : "검수 작업이 없습니다."}
      />
      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={DEFAULT_PAGE_SIZE}
        onChange={(next) => setParams({ page: next })}
      />
    </Card>
  );
};

export default ContentReviewManager;
