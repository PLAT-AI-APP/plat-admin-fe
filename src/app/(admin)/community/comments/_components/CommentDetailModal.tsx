"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useCommentDetailQuery } from "@/api/comment/getCommentDetail";
import { ExternalLink } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import {
  COMMENT_STATUS_LABEL,
  COMMENT_TARGET_TYPE_LABEL,
  getCommentTargetHref,
} from "@/type/comment";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { COMMENT_STATUS_TONE, COMMENT_TARGET_TYPE_TONE } from "./commentOptions";

interface CommentDetailModalProps {
  /** null이면 모달이 닫힌 상태다. */
  commentId: number | null;
  onClose: () => void;
}

/** 라벨 + 값 한 줄 */
const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-4 py-2">
    <p className="w-20 shrink-0 text-[13px] text-font-2">{label}</p>
    <div className="min-w-0 flex-1 text-[13px] text-font-1">{children}</div>
  </div>
);

/**
 * 댓글 상세 모달.
 * 신고 관리에서 신고된 댓글로 바로 넘어올 수 있어 목록 행이 아니라 ID로 조회한다.
 */
const CommentDetailModal = ({
  commentId,
  onClose,
}: CommentDetailModalProps) => {
  const { data, isLoading, isError } = useCommentDetailQuery(commentId);

  return (
    <Modal
      isOpen={commentId !== null}
      onClose={onClose}
      title="댓글 상세"
      description={data ? `#${data.commentId}` : undefined}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-field" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="댓글을 찾을 수 없습니다."
          description="이미 삭제되었을 수 있습니다."
        />
      )}

      {!isLoading && data && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={COMMENT_STATUS_TONE[data.status]}>
              {COMMENT_STATUS_LABEL[data.status]}
            </Badge>
            {data.parentCommentId && <Badge tone="neutral">대댓글</Badge>}
            {data.reportCount > 0 && (
              <Badge tone="danger">신고 {data.reportCount}</Badge>
            )}
          </div>

          <div className="rounded-field border border-border-main px-4 py-3 text-[14px] whitespace-pre-line text-font-1">
            {data.content}
          </div>

          {data.hiddenReason && (
            <div className="rounded-field border border-border-main bg-subtle px-4 py-3">
              <p className="text-[13px] font-medium text-warning">숨김 사유</p>
              <p className="mt-1 text-[13px] text-font-2">
                {data.hiddenReason}
              </p>
              {data.handledBy && (
                <p className="mt-1 text-[12px] text-font-2">
                  {data.handledBy} · {formatDateTime(data.handledAt)}
                </p>
              )}
            </div>
          )}

          <div className="rounded-field border border-border-main px-4 py-2">
            <DetailRow label="분류">
              <Badge tone={COMMENT_TARGET_TYPE_TONE[data.targetType]}>
                {COMMENT_TARGET_TYPE_LABEL[data.targetType]}
              </Badge>
            </DetailRow>

            <DetailRow label="대상">
              <Link
                href={getCommentTargetHref(data)}
                className="inline-flex items-center gap-1 transition hover:text-brand"
              >
                <span className="truncate">{data.targetName}</span>
                <ExternalLink size={12} className="shrink-0" />
              </Link>
            </DetailRow>

            <DetailRow label="작성자">
              <Link
                href={`/users/${data.authorId}`}
                className="inline-flex items-center gap-1 transition hover:text-brand"
              >
                <span className="truncate">{data.authorNickname}</span>
                <ExternalLink size={12} className="shrink-0" />
              </Link>
            </DetailRow>

            <DetailRow label="좋아요">
              <span className="tabular-nums">
                {formatWithCommas(data.likeCount)}
              </span>
            </DetailRow>

            <DetailRow label="작성일">
              {formatDateTime(data.createdAt)}
            </DetailRow>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CommentDetailModal;
