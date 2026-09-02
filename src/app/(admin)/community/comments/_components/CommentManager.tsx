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
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  COMMENT_STATUS_LABEL,
  COMMENT_TARGET_TYPE_LABEL,
  getCommentTargetHref,
  type Comment,
  type CommentSort,
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
import CommentHiddenReason from "./CommentHiddenReason";
import CommentHideModal from "./CommentHideModal";
import {
  COMMENT_SORT_OPTIONS,
  COMMENT_STATUS_FILTER_OPTIONS,
  COMMENT_STATUS_TONE,
  COMMENT_TARGET_TYPE_FILTER_OPTIONS,
  COMMENT_TARGET_TYPE_TONE,
} from "./commentOptions";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const COMMENT_CSV_COLUMNS: CsvColumn<Comment>[] = [
  { header: "ID", value: (row) => row.commentId },
  {
    header: "대상 종류",
    value: (row) => COMMENT_TARGET_TYPE_LABEL[row.targetType],
  },
  { header: "대상", value: (row) => row.targetName ?? row.targetId },
  { header: "대상 ID", value: (row) => row.targetId },
  { header: "내용", value: (row) => row.content },
  { header: "작성자", value: (row) => row.authorNickname },
  { header: "작성자 ID", value: (row) => row.authorId },
  { header: "상태", value: (row) => COMMENT_STATUS_LABEL[row.status] },
  { header: "신고 수", value: (row) => row.reportCount },
  { header: "좋아요 수", value: (row) => row.likeCount },
  { header: "숨김 사유", value: (row) => row.hiddenReason ?? "" },
  {
    header: "연쇄 조치",
    // 사유가 빈 숨김 행이 왜 비었는지는 이 칸을 봐야 알 수 있다.
    value: (row) => (row.cascaded ? "상위 댓글 조치로 함께 숨김" : ""),
  },
  { header: "작성일", value: (row) => formatDateTime(row.createdAt) },
];

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  targetType: "",
  status: "",
  onlyReported: "",
  sort: "CREATED_DESC",
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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hideTargets, setHideTargets] = useState<Comment[] | null>(null);
  /*
    빈 값(`?commentId=`)은 안 넘어온 것과 같이 다룬다. 그대로 두면 상세 조회가
    켜진 채로 ID 없는 경로를 부른다 — 열림 여부를 가르는 것은 `null` 하나뿐이다.
  */
  const [detailCommentId, setDetailCommentId] = useState<string | null>(
    linkedCommentId || null,
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

  const { hideMutation, restoreMutation, bulkHideMutation } =
    useCommentMutation();

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

  const toggleSelect = (commentId: string) => {
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
      hideMutation.mutate(
        { commentId: hideTargets[0].commentId, reason },
        { onSuccess: () => setHideTargets(null) },
      );
      return;
    }

    bulkHideMutation.mutate(
      {
        commentIds: hideTargets.map((comment) => comment.commentId),
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
      render: (row) => {
        const href = getCommentTargetHref(row);
        const label = row.targetName ?? row.targetId;

        // 콘솔에 상세 화면이 없는 대상은 링크를 걸지 않는다. 눌러서 404를 보는 편이 더 혼란스럽다.
        if (!href) {
          return <span className="truncate body-5 text-font-2">{label}</span>;
        }

        return (
          // 대상 이름을 누르면 목록이 아니라 그 대상의 상세로 바로 이동한다.
          <Link
            href={href}
            onClick={(event) => event.stopPropagation()}
            className="flex min-w-0 items-center gap-1 body-5 text-font-1 transition hover:text-brand"
          >
            <span className="truncate">{label}</span>
            <ExternalLink size={11} className="shrink-0" />
          </Link>
        );
      },
    },
    {
      key: "content",
      header: "내용",
      /*
       * 폭 상한이 있어야 한다. 표가 min-w-max 라 상한이 없으면 긴 숨김 사유가 칸을
       * 그대로 늘려 표 전체가 가로로 흐른다. 사유는 자르지 않는 대신 여기서 줄을 바꾼다.
       */
      render: (row) => (
        <div className="max-w-md min-w-0">
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

          <CommentHiddenReason comment={row} />
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
      /*
       * 작성자가 지운 댓글에는 할 일이 없다. 그건 작성자의 것이라 운영이 되살리지 않는다.
       * 내린 댓글은 되돌릴 수 있다 — 루트를 잘못 내리면 답글까지 함께 내려가기 때문이다.
       */
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
                label="재노출"
                icon={<Eye size={16} />}
                onClick={() => restoreMutation.mutate(row.commentId)}
                disabled={restoreMutation.isPending}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Alert tone="info" title="루트 댓글을 내리면 답글도 함께 내려갑니다.">
        함께 내려간 답글에는 사유가 붙지 않습니다. 그 작성자는 직접 제재를 받은
        것이 아니기 때문입니다. 되돌릴 때도 그렇게 딸려 내려간 답글만 함께
        올라오고, 따로 내려 둔 답글은 그대로 남습니다. 작성자가 지운 댓글은
        운영이 되살릴 수 없으며 지운 지 90일이 지나면 원문까지 파기됩니다.
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
          getRowKey={(row) => row.commentId}
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
        isSubmitting={hideMutation.isPending || bulkHideMutation.isPending}
      />
    </>
  );
};

export default CommentManager;
