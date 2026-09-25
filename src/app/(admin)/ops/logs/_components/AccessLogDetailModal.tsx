"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { AccessLog } from "@/type/ops";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  ACCESS_LOG_LEVEL_TONE,
  getAccessLogAppLabel,
} from "@/app/(admin)/ops/logs/_constants/logOptions";

interface AccessLogDetailModalProps {
  log: AccessLog | null;
  onClose: () => void;
  /** 이 요청을 보낸 사용자의 요청만 남긴다. */
  onFilterUser: (userId: string) => void;
}

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 break-all text-font-1">
      {value}
    </span>
  </div>
);

/** JSON이면 들여쓰기해서 편다. 아니면(폼 · 텍스트 · 잘린 본문) 원문 그대로 둔다. */
const prettyBody = (body: string): string => {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
};

const Body = ({ title, body }: { title: string; body?: string }) => (
  <div>
    <p className="mb-2 body-5 font-medium text-font-1">{title}</p>
    {body ? (
      <pre className="max-h-80 overflow-auto rounded-field border border-border-main bg-subtle px-3.5 py-3 body-6 whitespace-pre-wrap break-words text-font-1 scrollbar-thin">
        {prettyBody(body)}
      </pre>
    ) : (
      /* 본문이 없는 요청이거나, 보관 기한이 지나 본문만 지워진 기록이다. */
      <p className="body-5 text-font-disabled">
        없음 (본문이 없거나 보관 기한이 지나 지워짐)
      </p>
    )}
  </div>
);

/**
 * 접근 로그 상세.
 *
 * 목록은 경로 한 줄뿐이라 "무엇을 보냈고 무엇을 받았나"는 여기서 본다. 본문은
 * 서버가 적재 전에 가려 두었고(비밀번호 · 토큰 등), 8KB를 넘는 뒤쪽은 잘려 있다.
 */
const AccessLogDetailModal = ({
  log,
  onClose,
  onFilterUser,
}: AccessLogDetailModalProps) => {
  /* admin 앱 기록의 userId 는 관리자 ID라 유저 화면으로 보낼 수 없다. */
  const isServiceUser = Boolean(log?.userId) && log?.app !== "admin";

  return (
    <Modal
      isOpen={Boolean(log)}
      onClose={onClose}
      title="접근 로그 상세"
      description={log ? formatDateTimeSecond(log.createdAt) : undefined}
      size="lg"
    >
      {log && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Row
              label="요청"
              value={
                <code className="body-6">
                  {log.method} {log.path}
                  {log.queryString ? `?${log.queryString}` : ""}
                </code>
              }
            />
            <Row
              label="상태"
              value={
                <Badge tone={ACCESS_LOG_LEVEL_TONE[log.level]}>
                  {log.status}
                </Badge>
              }
            />
            <Row label="앱" value={getAccessLogAppLabel(log.app)} />
            <Row
              label="소요"
              value={
                <span className="tabular-nums">
                  {formatWithCommas(log.durationMs)}ms
                </span>
              }
            />
            <Row
              label={log.app === "admin" ? "관리자 ID" : "사용자 ID"}
              value={
                log.userId ? (
                  <span className="inline-flex items-center gap-3">
                    <code className="body-6">{log.userId}</code>
                    <button
                      type="button"
                      onClick={() => onFilterUser(log.userId as string)}
                      className="body-6 font-medium text-brand underline"
                    >
                      이 {isServiceUser ? "사용자" : "관리자"} 요청만 보기
                    </button>
                    {isServiceUser && (
                      <Link
                        href={`/users/${log.userId}`}
                        className="body-6 font-medium text-brand underline"
                      >
                        유저 상세
                      </Link>
                    )}
                  </span>
                ) : (
                  <span className="text-font-disabled">
                    없음 (로그인 전 요청)
                  </span>
                )
              }
            />
            <Row label="IP" value={log.remoteIp ?? "-"} />
            <Row
              label="User-Agent"
              value={<span className="body-6">{log.userAgent ?? "-"}</span>}
            />
            <Row
              label="로그 ID"
              value={<code className="body-6">{log.logId}</code>}
            />
          </div>

          <Body title="요청 본문" body={log.requestBody} />
          <Body title="응답 본문" body={log.responseBody} />
        </div>
      )}
    </Modal>
  );
};

export default AccessLogDetailModal;
