"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useContentReviewCountsQuery,
  useContentReviewListQuery,
} from "@/api/contentReview/getContentReviews";
import { useListParams } from "@/hooks/useListParams";
import { ChevronDown } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  ContentReviewQueueStatus,
  ContentReviewTargetType,
  ContentReviewTask,
} from "@/type/contentReview";
import { SERVICE_LANGUAGE_LABEL } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import {
  FINDING_FIELD_LABEL,
  TARGET_TYPE_LABEL,
  TARGET_TYPE_OPTIONS,
  isManualDecision,
  taskStatusBadge,
  taskTargetHref,
  taskTitle,
} from "../_lib/reviewMeta";

/** 주소에 실리는 목록 조건. 처음 열면 관리자 확인이 필요한 건부터 본다. */
const DEFAULT_PARAMS = { status: "MANUAL", targetType: "" };

/** 처리된 건은 처리 시각, 아직 안 끝난 건은 접수 시각을 보여 준다. */
const isFinishedTab = (status: ContentReviewQueueStatus) =>
  status === "APPROVED" || status === "REJECTED";

/** 반려 사유 · 수정 안내 · 원본 이미지. 행에 다 싣기엔 길어 펼쳐서 본다. */
const ReviewDetail = ({ task }: { task: ContentReviewTask }) => (
  <div className="flex flex-col gap-3 px-5 py-4">
    {task.reason && (
      <div className="flex flex-col gap-1">
        <span className="body-6 text-font-2">사유</span>
        <p className="body-5 whitespace-pre-wrap text-font-1">{task.reason}</p>
      </div>
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
    {task.input.images.length > 0 && (
      <div className="flex flex-col gap-1">
        <span className="body-6 text-font-2">원본 이미지 (주소가 만료되면 새로고침하세요)</span>
        <div className="flex flex-wrap gap-2">
          {task.input.images.map((image) => (
            <a
              key={image.fileId}
              href={image.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-24"
            >
              <EntityImage src={image.originalUrl} alt={`파일 ${image.fileId}`} fileId={image.fileId} />
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
  </div>
);

const hasDetail = (task: ContentReviewTask) =>
  !!task.reason || task.findings.length > 0 || task.input.images.length > 0;

const ContentReviewManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const status = params.status as ContentReviewQueueStatus;
  const targetType = params.targetType as ContentReviewTargetType | "";
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const { data: counts } = useContentReviewCountsQuery(targetType);
  const listQuery = useContentReviewListQuery({ status, targetType, size: DEFAULT_PAGE_SIZE });
  const rows = listQuery.data?.pages.flatMap((page) => page.content) ?? [];

  const tabs: TabItem<ContentReviewQueueStatus>[] = [
    { label: "관리자 확인 필요", value: "MANUAL", count: counts?.manual },
    { label: "반려", value: "REJECTED", count: counts?.rejected },
    { label: "자동 검수 대기", value: "READY", count: counts?.ready },
    { label: "검수 중", value: "RUNNING", count: counts?.running },
    { label: "승인", value: "APPROVED", count: counts?.approved },
  ];

  const handleToggleExpand = (key: string) => {
    const target = rows.find((row) => row.taskId === key);
    if (!target || !hasDetail(target)) return;
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
        return (
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
            primary={<span className="line-clamp-2 whitespace-pre-wrap">{row.reason}</span>}
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
        hasDetail(row) && (
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
        <Select
          options={TARGET_TYPE_OPTIONS}
          value={targetType}
          onChange={(event) => setParams({ targetType: event.target.value })}
          aria-label="검수 대상"
          selectBoxClassName="w-40"
        />
      </div>
      <Table
        columns={columns}
        rows={rows}
        isLoading={listQuery.isLoading}
        getRowKey={(row) => row.taskId}
        expandedKeys={expandedKeys}
        onToggleExpand={handleToggleExpand}
        renderExpanded={(row) => <ReviewDetail task={row} />}
        emptyTitle={status === "MANUAL" ? "관리자가 확인할 검수가 없습니다." : "검수 작업이 없습니다."}
      />
      {listQuery.hasNextPage && (
        <div className="flex justify-center border-t border-border-main py-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={listQuery.isFetchingNextPage}
            onClick={() => listQuery.fetchNextPage()}
          >
            더 보기
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ContentReviewManager;
