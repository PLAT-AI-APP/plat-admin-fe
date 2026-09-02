"use client";

import { formatDateTimeSecond } from "@/lib/dayjs";
import { formatAdmin } from "@/lib/utils";
import type { AdminAuditLog } from "@/type/ops";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  AUDIT_RESULT_LABEL,
  AUDIT_RESULT_TONE,
  getLogDomainLabel,
} from "../_constants/labels";

interface LogDetailModalProps {
  log: AdminAuditLog | null;
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
 * 관리자 활동 상세.
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
      title="관리자 활동 상세"
      description={log ? formatDateTimeSecond(log.createdAt) : undefined}
      size="md"
    >
      {log && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Row
              label="결과"
              value={
                <Badge tone={AUDIT_RESULT_TONE[log.result]}>
                  {AUDIT_RESULT_LABEL[log.result]}
                </Badge>
              }
            />
            <Row label="도메인" value={getLogDomainLabel(log.domain)} />
            <Row label="액션" value={log.action} />
            <Row label="실행자" value={formatAdmin(log.actor, log.actorId)} />
            {/* 실행 당시 직책. 지금 직책이 바뀌었어도 그때의 권한을 알 수 있어야 한다. */}
            <Row label="직책" value={log.roleName ?? "-"} />
            <Row
              label="대상"
              value={
                log.targetType
                  ? `${log.targetType}${log.targetId ? ` #${log.targetId}` : ""}`
                  : "-"
              }
            />
            <Row label="요청" value={<code>{log.message}</code>} />
            <Row label="접속 IP" value={log.ip ?? "-"} />
          </div>

          <div>
            <p className="mb-2 body-5 font-medium text-font-1">변경 내용</p>

            {payloadEntries.length === 0 ? (
              /*
               * "본문이 없었다"라고 단언하지 않는다. 본문이 비는 경로가 셋이고
               * 서로 뜻이 다르다 — 애초에 본문이 없는 요청(삭제 등), 서버가
               * 일부러 남기지 않는 파일 업로드, 그리고 90일이 지나 보관 기한이
               * 끝나 비워진 줄. 마지막 것을 "본문 없이 실행된 요청"으로 읽으면
               * 반년 전 조치를 되짚을 때 없던 사실을 있다고 믿게 된다.
               */
              <p className="rounded-field border border-border-main bg-subtle px-3.5 py-3 body-5 text-font-2">
                남아 있는 본문이 없습니다. 본문 없이 실행된 요청(삭제 · 상태
                변경 등)이거나, 파일 업로드이거나, 보관 기한(90일)이 지나 본문만
                비워진 기록입니다.
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
