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
      description={data ? `#${data.noticeId}` : undefined}
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
            {data.isPinned && <Badge tone="brand">고정</Badge>}

            <span className="ml-auto body-6 text-font-2 tabular-nums">
              조회 {formatWithCommas(data.viewCount)}
            </span>
          </div>

          {/*
            등록·수정 관리자 이력.
            계정이 삭제돼도 남도록 이름을 스냅샷으로 들고 있는 값이며,
            앱에 노출되는 공지에는 담기지 않는다(유저에게는 언제나 '운영자'다).
          */}
          <dl className="flex flex-col gap-1 rounded-field bg-subtle px-4 py-3 body-6 text-font-2">
            <div className="flex gap-2">
              <dt className="w-10 shrink-0 text-font-2">등록</dt>
              <dd className="text-font-1">
                {data.createdBy}
                <span className="ml-2 tabular-nums text-font-2">
                  {formatDateTime(data.createdAt)}
                </span>
              </dd>
            </div>

            <div className="flex gap-2">
              <dt className="w-10 shrink-0 text-font-2">수정</dt>
              <dd className={data.updatedBy ? "text-font-1" : "text-font-2"}>
                {data.updatedBy ? (
                  <>
                    {data.updatedBy}
                    <span className="ml-2 tabular-nums text-font-2">
                      {formatDateTime(data.updatedAt)}
                    </span>
                  </>
                ) : (
                  "수정 이력 없음"
                )}
              </dd>
            </div>
          </dl>

          <div className="rounded-field border border-border-main px-4 py-3 body-4">
            <MarkdownContent content={data.content} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NoticeViewModal;
