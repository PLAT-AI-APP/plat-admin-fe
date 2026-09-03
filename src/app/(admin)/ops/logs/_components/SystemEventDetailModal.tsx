"use client";

import { formatDateTimeSecond, formatFromNow } from "@/lib/dayjs";
import type { SystemEventLog } from "@/type/ops";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  SYSTEM_EVENT_LEVEL_LABEL,
  SYSTEM_EVENT_LEVEL_TONE,
  getSystemEventSourceLabel,
} from "../_constants/labels";

interface SystemEventDetailModalProps {
  event: SystemEventLog | null;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 break-all text-font-1">
      {value}
    </span>
  </div>
);

/**
 * 시스템 이벤트 상세.
 *
 * 목록의 메시지는 한 줄로 잘린다. 스택 첫 줄이나 외부 응답 본문이 붙은 메시지는
 * **잘린 뒤쪽에 원인이 있어서**, 목록만 보고는 무엇이 터졌는지 알 수 없다.
 * 여기서는 줄바꿈을 살려 전문을 보여 준다.
 *
 * 시각도 둘 다 편다. 묶인 줄이라 "언제 시작해서 마지막이 언제였나"가 곧
 * 지금도 나고 있는 장애인지, 이미 지나간 것인지를 가른다.
 */
const SystemEventDetailModal = ({
  event,
  onClose,
}: SystemEventDetailModalProps) => {
  return (
    <Modal
      isOpen={Boolean(event)}
      onClose={onClose}
      title="시스템 이벤트 상세"
      description={
        event ? formatDateTimeSecond(event.lastOccurredAt) : undefined
      }
      size="lg"
    >
      {event && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Row
              label="레벨"
              value={
                <Badge tone={SYSTEM_EVENT_LEVEL_TONE[event.level]}>
                  {SYSTEM_EVENT_LEVEL_LABEL[event.level]}
                </Badge>
              }
            />
            <Row
              label="발생원"
              value={getSystemEventSourceLabel(event.source)}
            />
            <Row
              label="발생 횟수"
              value={
                <span className="tabular-nums">
                  {event.occurrenceCount.toLocaleString()}회
                </span>
              }
            />
            <Row
              label="최초 발생"
              value={formatDateTimeSecond(event.firstOccurredAt)}
            />
            <Row
              label="최근 발생"
              value={`${formatDateTimeSecond(event.lastOccurredAt)} (${formatFromNow(event.lastOccurredAt)})`}
            />
            {/* 원본 로그는 관제 도구에 있다. 이 값으로 찾아간다. */}
            <Row
              label="traceId"
              value={
                event.traceId ? (
                  <code className="body-6">{event.traceId}</code>
                ) : (
                  /* 요청 밖(배치 등)에서 난 이벤트는 추적 키가 없다. */
                  <span className="text-font-disabled">
                    없음 (요청 밖에서 발생)
                  </span>
                )
              }
            />
          </div>

          <div>
            <p className="mb-2 body-5 font-medium text-font-1">메시지</p>
            <pre className="max-h-80 overflow-auto rounded-field border border-border-main bg-subtle px-3.5 py-3 body-5 whitespace-pre-wrap break-words text-font-1 scrollbar-thin">
              {event.message}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SystemEventDetailModal;
