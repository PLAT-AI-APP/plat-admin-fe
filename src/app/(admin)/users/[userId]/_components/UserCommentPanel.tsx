"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommentListQuery } from "@/api/comment/getCommentList";
import { ExternalLink } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas, truncate } from "@/lib/utils";
import {
  COMMENT_STATUS_LABEL,
  COMMENT_TARGET_TYPE_LABEL,
  getCommentTargetHref,
  type Comment,
} from "@/type/comment";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  COMMENT_STATUS_TONE,
  COMMENT_TARGET_TYPE_TONE,
} from "../../../community/comments/_components/commentOptions";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserCommentPanelProps {
  userId: number;
  nickname: string;
}

/** 이 유저가 쓴 댓글 목록. 댓글 관리 화면과 같은 컬럼 구성을 쓴다. */
const UserCommentPanel = ({ userId, nickname }: UserCommentPanelProps) => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCommentListQuery({
    page,
    size: USER_DETAIL_PAGE_SIZE,
    authorId: userId,
  });

  const columns: TableColumn<Comment>[] = [
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
        <Link
          href={getCommentTargetHref(row)}
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
      key: "reportCount",
      header: "신고",
      align: "right",
      numeric: true,
      width: "70px",
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
      width: "90px",
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
  ];

  return (
    <Card
      title={`작성 댓글 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="숨김 처리는 댓글 관리 화면에서 진행합니다."
      action={
        <Link
          href={`/community/comments?keyword=${encodeURIComponent(nickname)}`}
          className="flex items-center gap-1 body-5 text-font-2 transition hover:text-brand"
        >
          댓글 관리에서 보기
          <ExternalLink size={12} />
        </Link>
      }
      noPadding
    >
      <Table
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(row) => String(row.commentId)}
        isLoading={isLoading}
        skeletonRows={4}
        emptyTitle="작성한 댓글이 없습니다."
        emptyDescription={`'${nickname}' 유저가 남긴 댓글이 아직 없습니다.`}
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={USER_DETAIL_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default UserCommentPanel;
