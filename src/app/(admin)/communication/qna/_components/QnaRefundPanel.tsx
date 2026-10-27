"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/dayjs";
import { formatCurrency } from "@/lib/utils";
import type { QnaRefundLink } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ExternalLink } from "@/icons";
import { REFUND_REJECT_REASON_LABEL } from "@/constants/billingOptions";
import { getRefundResult } from "@/app/(admin)/communication/qna/_lib/refundResult";

interface QnaRefundPanelProps {
  refund: QnaRefundLink;
  /** 환불 결정 권한(refund:adjust). 승인 대기 건에서만 승인 · 거절 버튼을 보인다. */
  canDecide: boolean;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}

/**
 * 환불 문의에 묶인 환불의 지금 상태. 관리자에게만 보인다 — 유저는 관리자가 쓴 답변으로 결과를 안다.
 *
 * 환불 처리(노트 회수, PG 취소, 이상 건 복구)는 결제 상세가 그대로 맡는다. 승인 대기 건만 편의상
 * 이 자리에서 승인 · 거절할 수 있다.
 */
const QnaRefundPanel = ({
  refund,
  canDecide,
  onApprove,
  onReject,
  isApproving,
}: QnaRefundPanelProps) => {
  const result = getRefundResult(refund);
  const canDecideHere = refund.status === "REQUESTED" && canDecide;

  const rows: Array<{ label: string; value: string }> = [
    { label: "상품", value: refund.productName },
    { label: "환불 금액", value: formatCurrency(refund.refundAmount) },
    { label: "회수 노트", value: `${refund.refundCredit.toLocaleString()}개` },
    { label: "주문 번호", value: refund.orderUid },
    { label: "신청일", value: formatDateTime(refund.requestedAt) },
    {
      label: "결정일",
      value: refund.decidedAt ? formatDateTime(refund.decidedAt) : "-",
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-field border border-border-main p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="body-4 font-semibold text-font-0">환불 상태</p>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>

        <Link
          href={`/billing/payments/${refund.paymentOrderId}`}
          target="_blank"
          className="flex items-center gap-1 body-6 text-font-2 transition hover:text-brand"
        >
          결제 상세에서 보기
          <ExternalLink size={13} />
        </Link>
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="body-6 text-font-2">{row.label}</dt>
            <dd className="body-5 text-font-1">{row.value}</dd>
          </div>
        ))}
      </dl>

      {refund.status === "REJECTED" && refund.rejectReason && (
        <div className="rounded-field bg-subtle p-3">
          <p className="body-6 text-font-2">
            거절 사유
            {refund.rejectReasonCode &&
              ` · ${REFUND_REJECT_REASON_LABEL[refund.rejectReasonCode]}`}
          </p>
          <p className="mt-1 body-5 text-font-1">{refund.rejectReason}</p>
        </div>
      )}

      {/* 결정은 결제 상세와 같은 API를 쓴다. */}
      {canDecideHere && (
        <div className="flex items-center justify-end gap-2 border-t border-border-main pt-3">
          <Button variant="dangerGhost" size="sm" onClick={onReject}>
            환불 거절
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onApprove}
            isLoading={isApproving}
          >
            환불 승인
          </Button>
        </div>
      )}
    </div>
  );
};

export default QnaRefundPanel;
