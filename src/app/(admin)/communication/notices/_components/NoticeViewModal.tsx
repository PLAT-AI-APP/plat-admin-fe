"use client";

import { useNoticeDetailQuery } from "@/api/notice/getNoticeDetail";
import { Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { NOTICE_CATEGORY_LABEL, NOTICE_STATUS_LABEL } from "@/type/notice";
import type { Notice } from "@/type/notice";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { NOTICE_CATEGORY_TONE, NOTICE_STATUS_TONE } from "./noticeOptions";

interface NoticeViewModalProps {
  /** null이면 모달이 닫힌 상태다. */
  noticeId: number | null;
  onClose: () => void;
  /** 수정 버튼을 노출할 때만 전달한다. (댓글 관리 등에서 열면 수정은 제공하지 않는다) */
  onEdit?: (notice: Notice) => void;
}

/**
 * 공지 상세 모달.
 *
 * 앱에 노출되는 형태 그대로 본문을 확인한다.
 * 댓글 관리에서 대상 공지로 바로 넘어올 수 있어 목록 행이 아니라 ID로 조회한다.
 */
const NoticeViewModal = ({ noticeId, onClose, onEdit }: NoticeViewModalProps) => {
  const { data, isLoading, isError } = useNoticeDetailQuery(noticeId);

  return (
    <Modal
      isOpen={noticeId !== null}
      onClose={onClose}
      title={data?.title ?? "공지사항 상세"}
      description={
        data
          ? `#${data.noticeId} · ${data.createdBy} · ${formatDateTime(data.updatedAt)}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {onEdit && data && (
            <Button
              variant="primary"
              leftIcon={<Edit size={15} />}
              onClick={() => onEdit(data)}
            >
              수정
            </Button>
          )}
        </>
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
          title="공지사항을 찾을 수 없습니다."
          description="이미 삭제되었을 수 있습니다."
        />
      )}

      {!isLoading && data && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <Badge tone={NOTICE_CATEGORY_TONE[data.category]}>
              {NOTICE_CATEGORY_LABEL[data.category]}
            </Badge>
            <Badge tone={NOTICE_STATUS_TONE[data.status]}>
              {NOTICE_STATUS_LABEL[data.status]}
            </Badge>
            {data.isPinned && <Badge tone="brand">상단 고정</Badge>}

            <span className="ml-auto body-6 text-font-2 tabular-nums">
              조회 {formatWithCommas(data.viewCount)}
            </span>
          </div>

          <div className="rounded-field border border-border-main px-4 py-3 body-4">
            <MarkdownContent content={data.content} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NoticeViewModal;
