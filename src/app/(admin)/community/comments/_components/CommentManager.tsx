"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useListParams } from "@/hooks/useListParams";
import { useState } from "react";
import { useCommentListQuery } from "@/api/comment/getCommentList";
import { useCommentMutation } from "@/api/comment/mutateComment";
import { ExternalLink, Eye, EyeOff, Flag } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas, truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  COMMENT_STATUS_LABEL,
  COMMENT_TARGET_TYPE_LABEL,
  getCommentTargetHref,
  type Comment,
  type CommentStatus,
  type CommentTargetType,
} from "@/type/comment";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import CsvExportButton from "@/components/ui/CsvExportButton";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import CommentDetailModal from "./CommentDetailModal";
import CommentHideModal from "./CommentHideModal";
import {
  COMMENT_SORT_OPTIONS,
  COMMENT_STATUS_FILTER_OPTIONS,
  COMMENT_STATUS_TONE,
  COMMENT_TARGET_TYPE_FILTER_OPTIONS,
  COMMENT_TARGET_TYPE_TONE,
} from "./commentOptions";

type CommentSort = "RECENT" | "REPORTED";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const COMMENT_CSV_COLUMNS: CsvColumn<Comment>[] = [
  { header: "ID", value: (row) => row.commentId },
  {
    header: "대상 종류",
    value: (row) => COMMENT_TARGET_TYPE_LABEL[row.targetType],
  },
  { header: "대상", value: (row) => row.targetName },
  { header: "대상 ID", value: (row) => row.targetId },
  { header: "내용", value: (row) => row.content },
  { header: "작성자", value: (row) => row.authorNickname },
  { header: "작성자 ID", value: (row) => row.authorId },
  { header: "상태", value: (row) => COMMENT_STATUS_LABEL[row.status] },
  { header: "신고 수", value: (row) => row.reportCount },
  { header: "좋아요 수", value: (row) => row.likeCount },
  { header: "숨김 사유", value: (row) => row.hiddenReason ?? "" },
  { header: "작성일", value: (row) => formatDateTime(row.createdAt) },
];

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  targetType: "",
  status: "",
  onlyReported: "",
  sort: "RECENT",
};

const CommentManager = () => {
  // 신고 관리에서 신고된 댓글을 누르면 `?commentId=`를 달고 넘어온다. 그 댓글을 바로 연다.
  const linkedCommentId = useSearchParams().get("commentId");

  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const targetType = params.targetType as CommentTargetType | "";
  const status = params.status as CommentStatus | "";
  const onlyReported = params.onlyReported === "true";
  const sort = params.sort as CommentSort;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [hideTargets, setHideTargets] = useState<Comment[] | null>(null);
  const [detailCommentId, setDetailCommentId] = useState<number | null>(
    linkedCommentId ? Number(linkedCommentId) : null,
  );

  const { data, isLoading } = useCommentListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    targetType,
    status,
    onlyReported,
    sort,
  });

  const { statusMutation, bulkStatusMutation } = useCommentMutation();

  const comments = data?.content ?? [];

  /**
   * 필터가 바뀌면 선택을 비운다.
   * 페이지 되돌림은 `useListParams`가 처리한다. 안 비우면 화면에 없는 댓글이
   * 선택된 채로 일괄 처리에 끌려간다.
   */
  const applyFilter = (patch: Parameters<typeof setParams>[0]) => {
    setParams(patch);
    setSelectedIds([]);
  };

  const toggleSelect = (commentId: number) => {
    setSelectedIds((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId],
    );
  };

  /** 이미 숨겨졌거나 삭제된 댓글은 일괄 처리 대상이 아니다. */
  const selectableComments = comments.filter(
    (comment) => comment.status === "VISIBLE",
  );

  const isAllSelected =
    selectableComments.length > 0 &&
    selectableComments.every((comment) =>
      selectedIds.includes(comment.commentId),
    );

  const toggleSelectAll = () => {
    setSelectedIds(
      isAllSelected
        ? []
        : selectableComments.map((comment) => comment.commentId),
    );
  };

  const handleHide = (reason: string) => {
    if (!hideTargets) return;

    if (hideTargets.length === 1) {
      statusMutation.mutate(
        { commentId: hideTargets[0].commentId, status: "HIDDEN", reason },
        { onSuccess: () => setHideTargets(null) },
      );
      return;
    }

    bulkStatusMutation.mutate(
      {
        commentIds: hideTargets.map((comment) => comment.commentId),
        status: "HIDDEN",
        reason,
      },
      {
        onSuccess: () => {
          setHideTargets(null);
          setSelectedIds([]);
        },
      },
    );
  };

  const handleRestore = (comment: Comment) => {
    openConfirm({
      title: "댓글을 다시 노출할까요?",
      description: `'${truncate(comment.content, 40)}' 댓글이 앱에 다시 보입니다.`,
      confirmText: "노출",
      onConfirm: () =>
        statusMutation.mutateAsync({
          commentId: comment.commentId,
          status: "VISIBLE",
        }),
    });
  };

  const columns: TableColumn<Comment>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          label=""
          checked={isAllSelected}
          onChange={toggleSelectAll}
          disabled={selectableComments.length === 0}
        />
      ),
      width: "44px",
      render: (row) => (
        // 행 클릭(상세 모달)과 겹치지 않도록 선택 영역의 클릭은 여기서 멈춘다.
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            label=""
            checked={selectedIds.includes(row.commentId)}
            onChange={() => toggleSelect(row.commentId)}
            disabled={row.status !== "VISIBLE"}
          />
        </div>
      ),
    },
    {
      key: "targetType",
      header: "분류",
      width: "90px",
      render: (row) => (
        <Badge tone={COMMENT_TARGET_TYPE_TONE[row.targetType]}>
          {COMMENT_TARGET_TYPE_LABEL[row.targetType]}
        </Badge>
      ),
    },
    {
      key: "target",
      header: "대상",
      width: "180px",
      render: (row) => (
        // 대상 이름을 누르면 목록이 아니라 그 대상의 상세로 바로 이동한다.
        <Link
          href={getCommentTargetHref(row)}
          onClick={(event) => event.stopPropagation()}
          className="flex min-w-0 items-center gap-1 body-5 text-font-1 transition hover:text-brand"
        >
          <span className="truncate">{row.targetName}</span>
          <ExternalLink size={11} className="shrink-0" />
        </Link>
      ),
    },
    {
      key: "content",
      header: "내용",
      render: (row) => (
        <div className="min-w-0">
          {row.parentCommentId && (
            <span className="mr-1 body-6 text-font-disabled">↳ 대댓글</span>
          )}
          <span
            className={
              row.status === "VISIBLE"
                ? "text-font-1"
                : "text-font-disabled line-through"
            }
          >
            {truncate(row.content, 60)}
          </span>

          {row.hiddenReason && (
            <p className="mt-1 body-6 text-warning">
              사유: {row.hiddenReason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "author",
      header: "작성자",
      width: "140px",
      render: (row) => (
        <Link
          href={`/users/${row.authorId}`}
          onClick={(event) => event.stopPropagation()}
          className="text-font-2 transition hover:text-brand"
        >
          {truncate(row.authorNickname, 12)}
        </Link>
      ),
    },
    {
      key: "reportCount",
      header: "신고",
      align: "right",
      numeric: true,
      width: "80px",
      render: (row) =>
        row.reportCount > 0 ? (
          <span className="font-semibold text-danger">{row.reportCount}</span>
        ) : (
          <span className="text-font-disabled">0</span>
        ),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      width: "80px",
      render: (row) => formatWithCommas(row.likeCount),
    },
    {
      key: "status",
      header: "상태",
      width: "100px",
      render: (row) => (
        <Badge tone={COMMENT_STATUS_TONE[row.status]}>
          {COMMENT_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "작성일",
      width: "150px",
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "관리",
      align: "right",
      width: "80px",
      render: (row) => {
        if (row.status === "DELETED") {
          return <span className="body-6 text-font-disabled">-</span>;
        }

        return (
          // 행 클릭(상세 모달)과 겹치지 않도록 액션 영역의 클릭은 여기서 멈춘다.
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            {row.status === "VISIBLE" ? (
              <IconButton
                label="숨김"
                icon={<EyeOff size={16} />}
                tone="danger"
                onClick={() => setHideTargets([row])}
              />
            ) : (
              <IconButton
                label="다시 노출"
                icon={<Eye size={16} />}
                onClick={() => handleRestore(row)}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Alert tone="info" title="댓글은 전 영역을 한 화면에서 관리합니다.">
        지금은 세계관·캐릭터에만 댓글이 달리지만, 다른 영역에 댓글이 생겨도 대상
        종류만 다를 뿐 같은 방식으로 여기에서 처리합니다.
      </Alert>

      <Card
        title={`댓글 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="행을 클릭하면 댓글 상세가 열리고, 대상을 클릭하면 그 대상의 상세로 바로 이동합니다."
        action={
          <>
            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<EyeOff size={15} />}
                onClick={() =>
                  setHideTargets(
                    comments.filter((comment) =>
                      selectedIds.includes(comment.commentId),
                    ),
                  )
                }
              >
                선택 {selectedIds.length}건 숨김
              </Button>
            )}

            <CsvExportButton
              fileName="댓글"
              rows={comments}
              columns={COMMENT_CSV_COLUMNS}
              disabled={isLoading}
            />
          </>
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => {
              applyFilter({ keyword: next });
            }}
            placeholder="내용 · 작성자 · 대상으로 검색"
          />

          <div className="flex items-center gap-2">
            <Button
              variant={onlyReported ? "primary" : "secondary"}
              size="sm"
              leftIcon={<Flag size={15} />}
              onClick={() => {
                applyFilter({ onlyReported: onlyReported ? "" : "true" });
              }}
            >
              신고된 댓글만
            </Button>

            <Select
              aria-label="대상 필터"
              options={COMMENT_TARGET_TYPE_FILTER_OPTIONS}
              value={targetType}
              onChange={(event) => {
                applyFilter({ targetType: event.target.value });
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="상태 필터"
              options={COMMENT_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => {
                applyFilter({ status: event.target.value });
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="정렬"
              options={COMMENT_SORT_OPTIONS}
              value={sort}
              onChange={(event) => {
                applyFilter({ sort: event.target.value });
              }}
              selectBoxClassName="w-36"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={comments}
          getRowKey={(row) => String(row.commentId)}
          isLoading={isLoading}
          onRowClick={(row) => setDetailCommentId(row.commentId)}
          emptyTitle="조회된 댓글이 없습니다."
          emptyDescription="검색어나 필터를 바꿔서 다시 확인해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <CommentDetailModal
        commentId={detailCommentId}
        onClose={() => setDetailCommentId(null)}
      />

      <CommentHideModal
        targets={hideTargets}
        onClose={() => setHideTargets(null)}
        onSubmit={handleHide}
        isSubmitting={statusMutation.isPending || bulkStatusMutation.isPending}
      />
    </>
  );
};

export default CommentManager;
