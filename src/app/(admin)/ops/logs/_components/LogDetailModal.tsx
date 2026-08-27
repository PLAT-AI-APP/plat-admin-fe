"use client";

import { formatDateTimeSecond } from "@/lib/dayjs";
import type { OperationLog } from "@/type/ops";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  LOG_LEVEL_LABEL,
  LOG_LEVEL_TONE,
  getLogDomainLabel,
} from "../_constants/labels";

interface LogDetailModalProps {
  log: OperationLog | null;
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
 * 로그 상세.
 *
 * 목록의 한 줄로는 "누가 무엇을 했다"까지만 알 수 있다. **무엇을 어떻게 바꿨나**는
 * 요청 본문에 있으므로 여기서 펼쳐 준다. 비밀번호 같은 값은 적재 시점에 이미
 * 마스킹되어 들어온다.
 */
const LogDetailModal = ({ log, onClose }: LogDetailModalProps) => {
  const payloadEntries = Object.entries(log?.payload ?? {});

  return (
    <Modal
      isOpen={Boolean(log)}
      onClose={onClose}
      title="로그 상세"
      description={log ? formatDateTimeSecond(log.createdAt) : undefined}
      size="md"
    >
      {log && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Row
              label="레벨"
              value={
                <Badge tone={LOG_LEVEL_TONE[log.level]}>
                  {LOG_LEVEL_LABEL[log.level]}
                </Badge>
              }
            />
            <Row label="도메인" value={getLogDomainLabel(log.domain)} />
            <Row label="액션" value={log.action} />
            <Row
              label="실행자"
              value={
                log.actorId ? `${log.actor} (#${log.actorId})` : log.actor
              }
            />
            <Row
              label="대상"
              value={
                log.targetType
                  ? `${log.targetType}${log.targetId ? ` #${log.targetId}` : ""}`
                  : "-"
              }
            />
            <Row label="요청" value={<code>{log.message}</code>} />
          </div>

          <div>
            <p className="mb-2 body-5 font-medium text-font-1">변경 내용</p>

            {payloadEntries.length === 0 ? (
              <p className="rounded-field border border-border-main bg-subtle px-3.5 py-3 body-5 text-font-2">
                본문 없이 실행된 요청입니다. (삭제 · 상태 변경 등)
              </p>
            ) : (
              <ul className="flex flex-col rounded-field border border-border-main bg-subtle px-3.5 py-1">
                {payloadEntries.map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-start justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0"
                  >
                    <code className="shrink-0 body-6 text-font-2">
                      {key}
                    </code>
                    <span className="min-w-0 text-right body-5 break-all text-font-1">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LogDetailModal;
