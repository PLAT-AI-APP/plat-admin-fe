"use client";

import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { NOTICE_CATEGORY_LABEL, NOTICE_STATUS_LABEL } from "@/type/notice";
import type { Notice } from "@/type/notice";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MarkdownContent from "@/components/ui/MarkdownContent";
import Modal from "@/components/ui/Modal";
import { NOTICE_CATEGORY_TONE, NOTICE_STATUS_TONE } from "./noticeOptions";

interface NoticeViewModalProps {
  /** null이면 모달이 닫힌 상태다. */
  notice: Notice | null;
  onClose: () => void;
}

/** 앱에 노출되는 형태 그대로 본문을 확인한다. */
const NoticeViewModal = ({ notice, onClose }: NoticeViewModalProps) => {
  return (
    <Modal
      isOpen={notice !== null}
      onClose={onClose}
      title={notice?.title ?? ""}
      description={
        notice
          ? `#${notice.noticeId} · ${notice.createdBy} · ${formatDateTime(notice.updatedAt)}`
          : undefined
      }
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {notice && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <Badge tone={NOTICE_CATEGORY_TONE[notice.category]}>
              {NOTICE_CATEGORY_LABEL[notice.category]}
            </Badge>
            <Badge tone={NOTICE_STATUS_TONE[notice.status]}>
              {NOTICE_STATUS_LABEL[notice.status]}
            </Badge>
            {notice.isPinned && <Badge tone="brand">상단 고정</Badge>}

            <span className="ml-auto text-[12px] text-font-2 tabular-nums">
              조회 {formatWithCommas(notice.viewCount)}
            </span>
          </div>

          <div className="rounded-field border border-border-main px-4 py-3 text-[14px]">
            <MarkdownContent content={notice.content} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default NoticeViewModal;
