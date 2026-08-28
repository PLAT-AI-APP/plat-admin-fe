"use client";

import { ReactNode } from "react";
import { Copy, ExternalLink } from "@/icons";
import { formatDate, formatDateTimeSecond } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { formatCredit, formatCurrency, formatWithCommas } from "@/lib/utils";
import type { PaymentRecord } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import {
  EVENT_SOURCE_LABEL,
  PAYMENT_METHOD_LABEL,
  PG_PROVIDER_LABEL,
  RECORD_EVENT_LABEL,
  RECORD_STATUS_HINT,
  RECORD_STATUS_LABEL,
  RECORD_STATUS_TONE,
  RETENTION_BASIS,
  retentionDaysLeft,
} from "./recordOptions";

interface PaymentRecordDetailModalProps {
  record: PaymentRecord | null;
  onClose: () => void;
}

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section>
    <p className="body-5 font-medium text-font-1">{title}</p>
    {description && <p className="mt-0.5 body-6 text-font-2">{description}</p>}
    <div className="mt-2 flex flex-col rounded-field border border-border-main bg-subtle px-3.5 py-1">
      {children}
    </div>
  </section>
);

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 break-all text-font-1">
      {value}
    </span>
  </div>
);

/** 값이 없는 칸은 비워 두지 않고 `-`로 채운다. 조회에 실패한 것과 구분해야 한다. */
const orDash = (value?: ReactNode) =>
  value === undefined || value === null || value === "" ? (
    <span className="text-font-disabled">-</span>
  ) : (
    value
  );

/**
 * 조회 키는 눌러서 복사할 수 있어야 한다.
 *
 * 결제사에 문의하거나 티켓에 붙일 때 쓰는 값이라 **손으로 옮겨 적는 순간
 * 한 글자씩 틀린다.** 30자리 거래번호를 눈으로 대조하게 둘 이유가 없다.
 */
const CopyableValue = ({ value, label }: { value: string; label: string }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showAppToast("success", `${label}를 복사했습니다.`);
    } catch {
      // 클립보드 권한이 없는 환경에서는 직접 선택해 복사해야 한다.
      showAppToast("warning", "복사에 실패했습니다. 값을 직접 선택해 주세요.");
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <code className="body-5 break-all text-font-1">{value}</code>
      <IconButton
        label={`${label} 복사`}
        icon={<Copy size={14} />}
        size="sm"
        onClick={handleCopy}
        className="-my-1"
      />
    </span>
  );
};

/**
 * 결제 보존 원장 상세.
 *
 * 목록은 "이 거래가 어떻게 끝났나"까지만 답한다. 분쟁이 들어오면 필요한 것은
 * **결제사에 문의할 수 있는 값**(거래번호 · 주문번호 · 승인번호)과 **언제 무엇이
 * 일어났는지**, 그리고 **이 기록이 왜 아직 남아 있는지**다. 셋을 여기서 펼친다.
 */
const PaymentRecordDetailModal = ({
  record,
  onClose,
}: PaymentRecordDetailModalProps) => {
  const daysLeft = record ? retentionDaysLeft(record.retentionUntil) : 0;

  return (
    <Modal
      isOpen={Boolean(record)}
      onClose={onClose}
      title="결제 보존 원장 상세"
      description={record ? record.pgTid : undefined}
      size="lg"
    >
      {record && (
        <div className="flex flex-col gap-4">
          <Alert
            tone={record.purgedAt ? "warning" : "info"}
            title={
              record.purgedAt
                ? "개인정보가 파기된 기록입니다."
                : "개인정보가 아직 남아 있는 기록입니다."
            }
          >
            {record.purgedAt
              ? "이름 · 연락처 · 이메일 · 카드번호는 파기되어 남아 있지 않습니다. 결제사 거래번호로만 이 건을 특정할 수 있습니다."
              : "탈퇴 · 파기 이후에는 거래 정보만 남고 회원을 가리키는 값은 사라집니다."}
          </Alert>

          <Section
            title="조회 키"
            description="결제사에 문의하거나 분쟁에 대응할 때 쓰는 값입니다."
          >
            <Row
              label="PG 거래번호"
              value={
                <CopyableValue value={record.pgTid} label="PG 거래번호" />
              }
            />
            <Row
              label="가맹점 주문번호"
              value={
                <CopyableValue
                  value={record.merchantOrderId}
                  label="주문번호"
                />
              }
            />
            <Row
              label="카드 승인번호"
              value={
                record.approvalNo ? (
                  <CopyableValue value={record.approvalNo} label="승인번호" />
                ) : (
                  orDash()
                )
              }
            />
            <Row
              label="회원 식별 해시"
              value={<CopyableValue value={record.userKey} label="회원 해시" />}
            />
            <Row
              label="결제사 영수증"
              value={
                record.receiptUrl ? (
                  <a
                    href={record.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand underline"
                  >
                    영수증 열기
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  orDash()
                )
              }
            />
          </Section>

          <Section title="결제 정보">
            <Row
              label="상태"
              value={
                <span className="inline-flex items-center gap-2">
                  <Badge tone={RECORD_STATUS_TONE[record.status]}>
                    {RECORD_STATUS_LABEL[record.status]}
                  </Badge>
                  <span className="body-6 text-font-2">
                    {RECORD_STATUS_HINT[record.status]}
                  </span>
                </span>
              }
            />
            <Row
              label="결제사"
              value={PG_PROVIDER_LABEL[record.pgProvider]}
            />
            <Row
              label="결제수단"
              value={
                <>
                  {PAYMENT_METHOD_LABEL[record.method]}
                  {record.cardIssuer && ` · ${record.cardIssuer}`}
                  {record.installmentMonths
                    ? ` · ${record.installmentMonths}개월 할부`
                    : record.cardIssuer && " · 일시불"}
                </>
              }
            />
            <Row label="결제 플랫폼" value={record.platform} />
            <Row
              label="결제금액"
              value={
                <span className="font-medium tabular-nums">
                  {formatCurrency(record.amount)}
                </span>
              }
            />
            {/* 공급가액과 부가세는 세금계산·정산에서 매번 되묻는 값이라 나눠 적는다. */}
            <Row
              label="공급가액 / 부가세"
              value={
                <span className="tabular-nums">
                  {formatWithCommas(record.amount - record.vatAmount)} /{" "}
                  {formatWithCommas(record.vatAmount)}원
                </span>
              }
            />
            <Row
              label="환불금액"
              value={
                record.refundedAmount > 0 ? (
                  <span className="font-medium text-danger tabular-nums">
                    -{formatCurrency(record.refundedAmount)}
                  </span>
                ) : (
                  orDash()
                )
              }
            />
          </Section>

          <Section
            title="공급 내역"
            description="법정 보존 대상인 '재화 등의 공급에 관한 기록'입니다."
          >
            <Row label="상품명" value={record.productName} />
            <Row
              label="상품 코드"
              value={<code className="body-5">{record.productCode}</code>}
            />
            <Row
              label="지급 크레딧"
              value={
                <span className="tabular-nums">
                  {formatCredit(record.credit)}
                </span>
              }
            />
          </Section>

          <div>
            <p className="mb-2 body-5 font-medium text-font-1">거래 이력</p>

            <ul className="flex flex-col rounded-field border border-border-main bg-subtle px-3.5 py-1">
              {record.events.map((event, index) => (
                <li
                  key={`${event.type}-${event.occurredAt}-${index}`}
                  className="flex items-start justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="body-5 text-font-1">
                      {RECORD_EVENT_LABEL[event.type]}
                      <span className="ml-1.5 body-6 text-font-2">
                        {EVENT_SOURCE_LABEL[event.source]}
                      </span>
                    </p>
                    {event.reason && (
                      <p className="mt-0.5 body-6 text-font-2">
                        {event.reason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="body-5 text-font-1 tabular-nums">
                      {formatCurrency(event.amount)}
                    </p>
                    <p className="mt-0.5 body-6 text-font-2 tabular-nums">
                      {formatDateTimeSecond(event.occurredAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Section title="보존 정보">
            <Row
              label="회원 상태"
              value={
                record.isWithdrawn ? (
                  <Badge tone="neutral">탈퇴</Badge>
                ) : (
                  <Badge tone="info">이용 중</Badge>
                )
              }
            />
            <Row
              label="회원"
              value={
                record.userNickname
                  ? `${record.userNickname} (#${record.userId})`
                  : orDash()
              }
            />
            <Row label="탈퇴일" value={orDash(formatDate(record.withdrawnAt))} />
            <Row
              label="개인정보 파기일"
              value={
                record.purgedAt ? (
                  formatDateTimeSecond(record.purgedAt)
                ) : record.isWithdrawn ? (
                  <span className="text-warning">파기 대기</span>
                ) : (
                  orDash()
                )
              }
            />
            <Row
              label="보존 만료일"
              value={
                <span className="tabular-nums">
                  {formatDate(record.retentionUntil)}
                  <span
                    className={
                      daysLeft <= 0
                        ? "ml-1.5 text-danger"
                        : "ml-1.5 text-font-2"
                    }
                  >
                    {daysLeft > 0
                      ? `(${formatWithCommas(daysLeft)}일 남음)`
                      : "(파기 대상)"}
                  </span>
                </span>
              }
            />
            <Row label="보존 근거" value={RETENTION_BASIS} />
          </Section>
        </div>
      )}
    </Modal>
  );
};

export default PaymentRecordDetailModal;
