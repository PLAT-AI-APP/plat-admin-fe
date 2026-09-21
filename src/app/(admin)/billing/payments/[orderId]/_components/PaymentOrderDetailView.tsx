"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePaymentOrderDetailQuery } from "@/api/billing/getPaymentOrderDetail";
import { usePaymentOrderMutation } from "@/api/billing/mutatePaymentOrder";
import { Ban, CheckCircle, ExternalLink } from "@/icons";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import {
  cn,
  formatCredit,
  formatCurrency,
  formatSignedCredit,
} from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { AppError } from "@/type/api";
import type {
  AdminRefundReasonCode,
  PaymentAnomaly,
  PaymentCreditEntry,
  PaymentOrderDetail,
  PaymentOrderRefund,
  PgTransaction,
} from "@/type/billing";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import RefundRejectModal from "./RefundRejectModal";
import PaymentStatusCell from "../../_components/PaymentStatusCell";
import AdminRefundModal from "./AdminRefundModal";
import AnomalyResolveModal, { type AnomalyCloseMode } from "./AnomalyResolveModal";
import ManualCancelModal from "./ManualCancelModal";
import {
  CLAWBACK_STATUS_LABEL,
  LEDGER_TYPE_LABEL,
  LEDGER_TYPE_TONE,
  PAYMENT_ANOMALY_ACTION_LABEL,
  PAYMENT_ANOMALY_ACTIONS,
  PAYMENT_ANOMALY_GUIDE,
  PAYMENT_ANOMALY_LABEL,
  PAYMENT_EVENT_ACTOR_LABEL,
  PAYMENT_ORDER_METHOD_LABEL,
  PAYMENT_PG_PROVIDER_LABEL,
  PG_TRANSACTION_RESULT_LABEL,
  PG_TRANSACTION_RESULT_TONE,
  PG_TRANSACTION_TYPE_LABEL,
  REFUND_CHAT_IN_PROGRESS_MESSAGE,
  REFUND_CREDIT_USED_MESSAGE,
  REFUND_REASON_CODE_LABEL,
  REFUND_REJECT_REASON_LABEL,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_TONE,
  RETENTION_BASIS,
  retentionDaysLeft,
  type PaymentAnomalyAction,
} from "@/constants/billingOptions";

interface PaymentOrderDetailViewProps {
  orderId: string;
}

const CHAT_IN_PROGRESS_CODE = "PAYMENT_REFUND_CHAT_IN_PROGRESS";

/** 정보 한 줄 */
const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 break-all text-font-1">
      {value}
    </span>
  </div>
);

const Mono = ({ children }: { children?: ReactNode }) => (
  <span className="font-mono tabular-nums">{children ?? "-"}</span>
);

const PG_TRANSACTION_COLUMNS: TableColumn<PgTransaction>[] = [
  {
    key: "requestedAt",
    header: "시각",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.requestedAt)}</span>
    ),
  },
  {
    key: "type",
    header: "유형",
    width: "90px",
    render: (row) => PG_TRANSACTION_TYPE_LABEL[row.type],
  },
  {
    key: "result",
    header: "결과",
    width: "90px",
    render: (row) => (
      <Badge tone={PG_TRANSACTION_RESULT_TONE[row.result]}>
        {PG_TRANSACTION_RESULT_LABEL[row.result]}
      </Badge>
    ),
  },
  {
    key: "amount",
    header: "금액",
    width: "110px",
    align: "right",
    numeric: true,
    render: (row) => formatCurrency(row.amount),
  },
  {
    key: "pg",
    header: "PG 응답",
    render: (row) => (
      <span className="text-font-2">
        {[row.pgCode, row.pgMessage].filter(Boolean).join(" · ") || "-"}
      </span>
    ),
  },
];

const CREDIT_COLUMNS: TableColumn<PaymentCreditEntry>[] = [
  {
    key: "createdAt",
    header: "시각",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
    ),
  },
  {
    key: "type",
    header: "유형",
    width: "90px",
    render: (row) => (
      <Badge tone={LEDGER_TYPE_TONE[row.type]}>{LEDGER_TYPE_LABEL[row.type]}</Badge>
    ),
  },
  {
    key: "delta",
    header: "증감",
    width: "120px",
    align: "right",
    numeric: true,
    render: (row) => (
      <span className={cn("font-semibold", row.creditDelta < 0 && "text-danger")}>
        {formatSignedCredit(row.creditDelta)}
      </span>
    ),
  },
  {
    key: "memo",
    header: "메모",
    render: (row) => <span className="text-font-2">{row.memo}</span>,
  },
];

/**
 * 환불 승인 판단.
 *
 * 규칙은 하나다 — **이 결제로 받은 노트를 1 CR이라도 쓰면 승인할 수 없다.** 신청은 미사용일 때만
 * 접수되므로, 여기서 보이는 사용은 전부 신청 뒤의 일이다. 서버의 풀 차감 기록이 근거다.
 * 잔액을 함께 두는 이유는 노트가 지갑 하나에 합쳐지기 때문이다. 운영자는 이 두 줄만 보면 결론을 낼 수 있어야 한다.
 */
const RefundJudgment = ({
  refund,
  balance,
}: {
  refund: PaymentOrderRefund;
  balance?: number;
}) => {
  const usage = refund.poolUsage;
  const used = usage ? usage.totalAmount - usage.remainingAmount : 0;
  const isShort = balance !== undefined && balance < refund.refundCredit;

  const verdict =
    used > 0
      ? { tone: "danger" as const, text: "승인 불가 · 신청 뒤 사용" }
      : isShort
        ? { tone: "danger" as const, text: "승인 불가 · 잔액 부족" }
        : refund.chatInProgress
          ? { tone: "warning" as const, text: "대기 · 채팅이 끝나야 판단 가능" }
          : { tone: "success" as const, text: "승인 가능" };

  return (
    <>
      <InfoRow
        label="이 결제 노트 사용"
        value={
          <span className={cn("tabular-nums", used > 0 ? "font-semibold text-danger" : "")}>
            {used > 0 ? `-${formatCredit(used)}` : "없음"}
          </span>
        }
      />
      <InfoRow
        label="현재 잔액 / 회수할 노트"
        value={
          <span className={cn("tabular-nums", isShort && "font-semibold text-danger")}>
            {balance === undefined ? "-" : formatCredit(balance)} /{" "}
            {formatCredit(refund.refundCredit)}
          </span>
        }
      />
      <InfoRow label="승인 판단" value={<Badge tone={verdict.tone}>{verdict.text}</Badge>} />
    </>
  );
};

/**
 * 결제 상세.
 *
 * 결제 장부 · 환불 관리 · 보존 원장이 나눠 보던 것을 **결제 한 건 기준으로** 모은다.
 * 운영자가 받는 질문은 "이 결제 어떻게 됐어요?" 하나라, 답이 한 화면에 있어야 한다.
 *
 * 위에서 아래로 읽는 순서가 곧 할 일의 순서다.
 * 1. 지금 처리할 것(열린 이상 · 환불 요청)을 맨 위 경고로
 * 2. 돈 · 노트 · 사람 · 보존의 현재 값
 * 3. 무슨 일이 어떤 순서로 있었는지(진행 기록)
 * 4. 근거 원본(PG 호출 · 크레딧 원장 · 지난 이상 기록)
 */
const PaymentOrderDetailView = ({ orderId }: PaymentOrderDetailViewProps) => {
  const [resolveTarget, setResolveTarget] = useState<{
    anomaly: PaymentAnomaly;
    mode: AnomalyCloseMode;
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentOrderRefund | null>(null);
  const [isAdminRefundOpen, setIsAdminRefundOpen] = useState(false);
  const [isManualCancelOpen, setIsManualCancelOpen] = useState(false);

  /*
    환불 결정과 이상 확인 처리는 둘 다 돈을 다루는 사람이 한다. 서버 권한 자원에
    '결제 쓰기'가 따로 생기기 전까지는 환불 권한으로 묶는다.
  */
  const canAct = useHasPermission("refund:adjust");
  const { data: order, isLoading, isError, error } =
    usePaymentOrderDetailQuery(orderId);
  const {
    resolveMutation,
    approveMutation,
    rejectMutation,
    retryMutation,
    inquiryMutation,
    adminRefundMutation,
    acceptCaptureMutation,
    manualCancelMutation,
    restoreCreditMutation,
  } = usePaymentOrderMutation();

  const pendingOf: Record<PaymentAnomalyAction, boolean> = {
    RETRY_FULFILLMENT: retryMutation.isPending,
    PG_INQUIRY: inquiryMutation.isPending,
    ACCEPT_PG_CAPTURE: acceptCaptureMutation.isPending,
    RECORD_MANUAL_CANCEL: manualCancelMutation.isPending,
    RESTORE_CREDIT: restoreCreditMutation.isPending,
  };

  const pendingRefund = order?.refunds.find((refund) => refund.status === "REQUESTED");
  const openAnomalies = order?.anomalies.filter((item) => !item.resolvedAt) ?? [];
  const pastAnomalies = order?.anomalies.filter((item) => item.resolvedAt) ?? [];
  /*
    관리자 환불은 돈이 들어와 있고 진행 중인 환불이 없을 때만 연다. 유저 요청이
    대기 중이면 그걸 승인하는 것이 맞다 — 둘 다 열어 두면 같은 결제가 두 번 나간다.
  */
  const canAdminRefund =
    order?.paymentStatus === "CAPTURED" &&
    // 노트가 이미 빠진 건(환불 실패 등)에 걸면 한 번 더 회수된다. 지급된 상태에서만 연다.
    order.fulfillmentStatus === "GRANTED" &&
    !order.refunds.some(
      (refund) =>
        ["REQUESTED", "PROCESSING"].includes(refund.status) ||
        // PG가 거절해 노트만 빠진 환불이 남아 있으면 서버가 새 환불을 막는다. 복구 · 직접 취소가 먼저다.
        (refund.status === "FAILED" && refund.clawbackStatus === "DONE"),
    );
  const nickname = order?.userNickname ?? (order ? `탈퇴 회원 #${order.userId}` : "");

  const handleApprove = (target: PaymentOrderDetail, refund: PaymentOrderRefund) => {
    openConfirm({
      title: "환불을 승인할까요?",
      description: `${PAYMENT_PG_PROVIDER_LABEL[target.pgProvider]}로 ${formatCurrency(refund.refundAmount)}을 취소하고, '${nickname}' 님의 노트 ${formatCredit(refund.refundCredit)}를 회수합니다.`,
      warning: refund.creditUsedSinceRequest
        ? "신청 뒤 유저가 노트를 사용했습니다. 승인하면 크레딧 사용으로 자동 거절됩니다."
        : "승인하면 PG로 돈이 나가며 되돌릴 수 없습니다.",
      confirmText: "승인",
      tone: "danger",
      onConfirm: async () => {
        try {
          await approveMutation.mutateAsync({
            orderId: target.paymentOrderId,
            refundId: refund.refundId,
          });
        } catch (caught) {
          if ((caught as AppError).code === CHAT_IN_PROGRESS_CODE) {
            throw new Error(REFUND_CHAT_IN_PROGRESS_MESSAGE);
          }

          throw caught;
        }
      },
    });
  };

  const handleReject = (reason: string) => {
    if (!order || !rejectTarget) return;

    rejectMutation.mutate(
      { orderId: order.paymentOrderId, refundId: rejectTarget.refundId, reason },
      {
        onSuccess: () => setRejectTarget(null),
        onError: (caught) => showErrorToast(caught),
      },
    );
  };

  const openAdminRefund = () => setIsAdminRefundOpen(true);

  const handleAdminRefund = (input: {
    reasonCode: AdminRefundReasonCode;
    reason: string;
  }) => {
    if (!order) return;

    adminRefundMutation.mutate(
      { orderId: order.paymentOrderId, ...input },
      {
        onSuccess: () => setIsAdminRefundOpen(false),
        onError: (caught) => showErrorToast(caught),
      },
    );
  };

  /** 이상마다 붙는 조치. 성공하면 서버가 그 이상을 스스로 닫는다. */
  const runAnomalyAction = (
    target: PaymentOrderDetail,
    action: PaymentAnomalyAction,
  ) => {
    if (action === "RETRY_FULFILLMENT") {
      openConfirm({
        title: "노트 지급을 다시 시도할까요?",
        description: `'${nickname}' 님에게 ${formatCredit(target.creditAmount)}를 지급합니다. 이 주문 기준으로 한 번만 지급되므로 배치가 뒤늦게 성공해도 두 번 나가지 않습니다.`,
        confirmText: "지급 재시도",
        onConfirm: () => retryMutation.mutateAsync(target.paymentOrderId),
      });
      return;
    }

    // 조회는 PG에 묻기만 한다. 돈을 움직이지 않으니 확인 없이 바로 보낸다.
    if (action === "PG_INQUIRY") {
      inquiryMutation.mutate(target.paymentOrderId, {
        onError: (caught) => showErrorToast(caught),
      });
      return;
    }

    if (action === "ACCEPT_PG_CAPTURE") {
      openConfirm({
        title: "PG 승인을 인정할까요?",
        description: `PG 정산대로 ${formatCurrency(target.amount)} 결제를 완료로 되살리고, '${nickname}' 님에게 ${formatCredit(target.creditAmount)}를 지급합니다.`,
        warning: "PG 관리자 화면에서 이미 취소했다면 이 조치 대신 'PG 직접 취소 기록'을 쓰세요. 둘 다 하면 돈 없이 노트만 나갑니다.",
        confirmText: "승인 인정",
        onConfirm: () => acceptCaptureMutation.mutateAsync(target.paymentOrderId),
      });
      return;
    }

    if (action === "RECORD_MANUAL_CANCEL") {
      setIsManualCancelOpen(true);
      return;
    }

    // RESTORE_CREDIT
    const failedRefund = target.refunds.find((refund) => refund.status === "FAILED");
    openConfirm({
      title: "회수한 노트를 되돌릴까요?",
      description: `'${nickname}' 님에게 ${formatCredit(failedRefund?.refundCredit ?? target.refundedCredit)}를 다시 넣어 환불 전 상태로 돌립니다. 환불은 실패로 남습니다.`,
      warning: "PG에서 직접 취소해 돈을 돌려줬다면 되돌리지 마세요. 돈과 노트를 모두 주게 됩니다.",
      confirmText: "노트 되돌리기",
      onConfirm: () => restoreCreditMutation.mutateAsync(target.paymentOrderId),
    });
  };

  const handleManualCancel = (input: { pgCancelNo: string; memo: string }) => {
    if (!order) return;

    manualCancelMutation.mutate(
      { orderId: order.paymentOrderId, ...input },
      {
        onSuccess: () => setIsManualCancelOpen(false),
        onError: (caught) => showErrorToast(caught),
      },
    );
  };

  const handleResolve = (memo: string) => {
    if (!order || !resolveTarget) return;

    resolveMutation.mutate(
      { orderId: order.paymentOrderId, anomalyId: resolveTarget.anomaly.anomalyId, memo },
      {
        onSuccess: () => setResolveTarget(null),
        onError: (caught) => showErrorToast(caught),
      },
    );
  };

  return (
    <>
      <BackLink href="/billing/payments" label="결제 내역" />

      <PageHeader
        title={order ? `결제 ${order.orderUid}` : "결제 상세"}
        description={
          order
            ? `${nickname} · ${order.productName} · ${formatCurrency(order.amount)}`
            : undefined
        }
        action={
          order &&
          canAct &&
          (pendingRefund || canAdminRefund) && (
            <div className="flex items-center gap-2">
              {canAdminRefund && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openAdminRefund()}
                >
                  관리자 환불
                </Button>
              )}
              {pendingRefund && (
                <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Ban size={15} />}
                onClick={() => setRejectTarget(pendingRefund)}
              >
                환불 거절
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle size={15} />}
                disabled={pendingRefund.chatInProgress}
                onClick={() => handleApprove(order, pendingRefund)}
              >
                환불 승인
              </Button>
                </>
              )}
            </div>
          )
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="결제 정보를 불러오지 못했습니다."
            description={error?.message}
          />
        </Card>
      )}

      {!isLoading && order && (
        <>
          {/* 1. 지금 처리할 것 */}
          {openAnomalies.map((item) => (
            <Alert
              key={item.anomalyId}
              tone="danger"
              title={`확인 필요 · ${PAYMENT_ANOMALY_LABEL[item.type]}`}
              action={
                canAct && (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {PAYMENT_ANOMALY_ACTIONS[item.type].map((action, index) => (
                        <Button
                          key={action}
                          // 첫 조치가 권장 조치다. 나머지는 대안이라 한 단계 낮춘다.
                          variant={index === 0 ? "primary" : "secondary"}
                          size="sm"
                          isLoading={pendingOf[action]}
                          onClick={() => runAnomalyAction(order, action)}
                        >
                          {PAYMENT_ANOMALY_ACTION_LABEL[action]}
                        </Button>
                      ))}
                    {/*
                      조치가 성공하면 이상은 저절로 닫힌다. 조치 없이 닫는 길은 휴먼 에러가 나는 자리라,
                      고칠 게 없을 수 있는 PG 대사 불일치에만 드러내고 나머지는 더보기 안의 예외로 숨긴다.
                    */}
                    {item.type === "PG_MISMATCH" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setResolveTarget({ anomaly: item, mode: "CLEAR" })}
                      >
                        문제 없음으로 닫기
                      </Button>
                    ) : (
                      <Dropdown
                        align="right"
                        items={[
                          {
                            label: "예외로 닫기",
                            tone: "danger",
                            onSelect: () => setResolveTarget({ anomaly: item, mode: "EXCEPTION" }),
                          },
                        ]}
                      />
                    )}
                  </div>
                )
              }
            >
              <p>{PAYMENT_ANOMALY_GUIDE[item.type]}</p>
              <p className="mt-1 body-6 opacity-80">
                판정 근거: {item.detail} · {formatDateTime(item.detectedAt)}
              </p>
            </Alert>
          ))}

          {pendingRefund?.creditUsedSinceRequest && (
            <Alert tone="danger" title="환불 신청 뒤 유저가 노트를 사용했습니다.">
              승인하면 서버가 크레딧 사용으로 자동 거절하고, 유저에게는 &lsquo;
              {REFUND_CREDIT_USED_MESSAGE}&rsquo;가 안내됩니다.
            </Alert>
          )}

          {pendingRefund?.chatInProgress && (
            <Alert tone="warning" title="완료되지 않은 채팅이 있습니다.">
              {REFUND_CHAT_IN_PROGRESS_MESSAGE}
            </Alert>
          )}

          {pendingRefund &&
            !pendingRefund.creditUsedSinceRequest &&
            !pendingRefund.chatInProgress && (
              <Alert tone="info" title="환불 승인을 기다리고 있습니다.">
                승인하면 {PAYMENT_PG_PROVIDER_LABEL[order.pgProvider]}로{" "}
                {formatCurrency(pendingRefund.refundAmount)} 전액이 취소되고 노트{" "}
                {formatCredit(pendingRefund.refundCredit)}가 회수됩니다. 기한(결제 후
                7일)은 신청 시점으로 판정합니다.
              </Alert>
            )}

          {/* 2. 현재 값 */}
          <div className="grid grid-cols-2 gap-4">
            <Card title="결제" bodyClassName="px-5 py-1">
              <InfoRow label="상태" value={<PaymentStatusCell order={order} />} />
              <InfoRow
                /* 상태는 위 한 줄이 말한다. 여기서는 배지 없이 금액만 적는다. */
                label="오간 금액"
                value={
                  <span className="tabular-nums">
                    승인 {formatCurrency(order.paidAmount)}
                    {order.refundedAmount > 0 &&
                      ` · 환불 ${formatCurrency(order.refundedAmount)}`}
                  </span>
                }
              />
              <InfoRow
                label="노트"
                value={
                  <span className="tabular-nums">
                    {formatCredit(order.creditAmount)}
                    {order.bonusCredits > 0 &&
                      ` (보너스 ${formatCredit(order.bonusCredits)})`}
                    {/* 지급 전이면 금액만 보고 받은 것으로 읽지 않게 한 마디 붙인다. */}
                    {!["GRANTED", "CLAWED_BACK"].includes(order.fulfillmentStatus) &&
                      " · 미지급"}
                    {order.refundedCredit > 0 &&
                      ` · 회수 ${formatCredit(order.refundedCredit)}`}
                  </span>
                }
              />
              <InfoRow label="상품" value={`${order.productName} (${order.productCode})`} />
              <InfoRow label="주문 금액" value={formatCurrency(order.amount)} />
              <InfoRow
                label="PG · 수단"
                value={`${PAYMENT_PG_PROVIDER_LABEL[order.pgProvider]} · ${
                  order.paymentMethod
                    ? PAYMENT_ORDER_METHOD_LABEL[order.paymentMethod]
                    : "미정"
                }`}
              />
              <InfoRow label="PG 거래번호" value={<Mono>{order.pgTransactionId}</Mono>} />
              {order.approvalNo && (
                <InfoRow label="카드 승인번호" value={<Mono>{order.approvalNo}</Mono>} />
              )}
              {order.cardIssuer && (
                <InfoRow
                  label="카드사 · 할부"
                  value={`${order.cardIssuer} · ${
                    order.installmentMonths ? `${order.installmentMonths}개월` : "일시불"
                  }`}
                />
              )}
              {order.vatAmount !== undefined && (
                <InfoRow
                  label="공급가액 · 부가세"
                  value={
                    <span className="tabular-nums">
                      {formatCurrency(order.paidAmount - order.vatAmount)} ·{" "}
                      {formatCurrency(order.vatAmount)}
                    </span>
                  }
                />
              )}
              {order.receiptUrl && (
                <InfoRow
                  label="PG 영수증"
                  value={
                    <a
                      href={order.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 transition hover:text-brand"
                    >
                      영수증 원본
                      <ExternalLink size={12} />
                    </a>
                  }
                />
              )}
              <InfoRow label="주문번호" value={<Mono>{order.orderUid}</Mono>} />
              <InfoRow label="주문일" value={formatDateTime(order.requestedAt)} />
              <InfoRow
                label="승인일"
                value={order.paidAt ? formatDateTime(order.paidAt) : "-"}
              />
              <InfoRow
                label="환불 기한"
                value={order.refundableUntil ? formatDateTime(order.refundableUntil) : "-"}
              />
              {order.failureMessage && (
                <InfoRow
                  label="실패 사유"
                  value={`${order.failureMessage} (${order.failureCode})`}
                />
              )}
              {order.cashReceiptNumber && (
                <InfoRow label="현금영수증" value={<Mono>{order.cashReceiptNumber}</Mono>} />
              )}
            </Card>

            <div className="flex flex-col gap-4">
              <Card title="유저" bodyClassName="px-5 py-1">
                <InfoRow
                  label="유저"
                  value={
                    order.isWithdrawn ? (
                      <span className="text-font-2">탈퇴 회원 #{order.userId}</span>
                    ) : (
                      <Link
                        href={`/users/${order.userId}`}
                        className="transition hover:text-brand"
                      >
                        {nickname} (#{order.userId})
                      </Link>
                    )
                  }
                />
                {/*
                  결제 기록의 유저 ID는 FK 없는 회계 키라 탈퇴 뒤에도 남는다. 같은 사람의
                  다른 결제는 이 ID로 모아 본다.
                */}
                <InfoRow
                  label="이 유저의 결제"
                  value={
                    <Link
                      href={`/billing/payments?userId=${order.userId}`}
                      className="transition hover:text-brand"
                    >
                      모아 보기
                    </Link>
                  }
                />
                <InfoRow label="탈퇴" value={order.isWithdrawn ? "탈퇴함" : "-"} />
              </Card>

              {/*
                보존 원장을 따로 두지 않는다. 결제 주문 표 자체가 개인정보 없이 5년을
                버티도록 만들어져 있어, 보존은 이 결제의 속성 하나일 뿐이다.
              */}
              <Card title="법정 보존" bodyClassName="px-5 py-1">
                <InfoRow
                  label="보존 만료"
                  value={
                    <span className="tabular-nums">
                      {formatDate(order.retentionUntil)} (D-
                      {retentionDaysLeft(order.retentionUntil)})
                    </span>
                  }
                />
                <InfoRow label="근거" value={<span className="body-6">{RETENTION_BASIS}</span>} />
              </Card>
            </div>
          </div>

          {/* 3. 진행 기록 */}
          <Card
            title="진행 기록"
            description="주문 · PG 호출 · 노트 지급 · 환불 · 관리자 조치를 시간순으로 합쳤습니다."
          >
            <ol className="relative flex flex-col gap-4 border-l border-border-main pl-5">
              {order.timeline.map((item, index) => (
                <li key={`${item.occurredAt}-${index}`} className="relative">
                  <span
                    className={cn(
                      "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-surface",
                      {
                        neutral: "bg-neutral",
                        info: "bg-info",
                        success: "bg-success",
                        warning: "bg-warning",
                        danger: "bg-danger",
                      }[item.tone],
                    )}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="body-6 text-font-2 tabular-nums">
                      {formatDateTime(item.occurredAt)}
                    </span>
                    <Badge tone="neutral">{PAYMENT_EVENT_ACTOR_LABEL[item.actor]}</Badge>
                    <span className="body-5 font-medium text-font-1">{item.title}</span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 body-6 break-all text-font-2">{item.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          {order.refunds.map((refund) => (
            <Card key={refund.refundId} title={`환불 ${refund.refundUid}`} bodyClassName="px-5 py-1">
              <InfoRow
                label="상태"
                value={
                  <Badge tone={REFUND_STATUS_TONE[refund.status]}>
                    {REFUND_STATUS_LABEL[refund.status]}
                  </Badge>
                }
              />
              <InfoRow label="경위" value={REFUND_REASON_CODE_LABEL[refund.reasonCode]} />
              <InfoRow label="사유" value={refund.reason ?? "-"} />
              <InfoRow
                label="금액 · 노트"
                value={`${formatCurrency(refund.refundAmount)} · ${formatCredit(refund.refundCredit)} (${CLAWBACK_STATUS_LABEL[refund.clawbackStatus]})`}
              />
              <InfoRow label="신청일" value={formatDateTime(refund.requestedAt)} />
              {refund.status === "REQUESTED" && (
                <RefundJudgment
                  refund={refund}
                  balance={order.userCreditBalance}
                />
              )}
              {refund.status === "REQUESTED" &&
                refund.poolUsage &&
                (refund.poolUsage.entries.length > 0 ||
                  refund.poolUsage.unrecordedAmount > 0) && (
                <div className="border-b border-border-main py-2.5">
                  <p className="body-5 text-font-2">이 결제 노트 사용 내역</p>
                  {refund.poolUsage.unrecordedAmount > 0 && (
                    <p className="mt-1 body-6 text-font-2">
                      기록 이전 사용 {formatCredit(refund.poolUsage.unrecordedAmount)} (줄 단위 기록 없음)
                    </p>
                  )}
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {refund.poolUsage.entries.map((entry) => (
                      <li
                        key={entry.ledgerId}
                        className="flex items-center justify-between body-6"
                      >
                        <span className="text-font-2 tabular-nums">
                          {formatDateTime(entry.createdAt)} · {entry.memo}
                        </span>
                        <span className="font-semibold text-danger tabular-nums">
                          {formatSignedCredit(entry.creditDelta)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <InfoRow
                label="결정"
                value={
                  refund.decidedAt
                    ? `${formatDateTime(refund.decidedAt)} · ${refund.processedBy ?? "시스템"}`
                    : "-"
                }
              />
              {refund.status === "REJECTED" && (
                <InfoRow
                  label="거절 사유"
                  value={`${refund.rejectReasonCode ? REFUND_REJECT_REASON_LABEL[refund.rejectReasonCode] : ""} · ${
                    refund.rejectReason ??
                    (refund.rejectReasonCode === "CREDIT_USED" ? REFUND_CREDIT_USED_MESSAGE : "-")
                  }`}
                />
              )}
            </Card>
          ))}

          {/* 4. 근거 원본 */}
          <Card
            title="PG 거래 이력"
            description="이 주문으로 PG를 부른 기록입니다. 판정 불가 뒤의 결과 조회까지 모두 남습니다."
            noPadding
          >
            <Table
              columns={PG_TRANSACTION_COLUMNS}
              rows={order.pgTransactions}
              getRowKey={(row, index) => `${row.type}-${row.requestedAt}-${index}`}
              minRows={0}
              emptyTitle="PG 호출 기록이 없습니다."
            />
          </Card>

          <Card
            title="크레딧 원장"
            description="이 결제로 유저 잔액이 움직인 줄입니다. 결제와 무관한 사용 · 조정은 유저 상세에서 봅니다."
            noPadding
          >
            <Table
              columns={CREDIT_COLUMNS}
              rows={order.creditEntries}
              getRowKey={(row) => row.ledgerId}
              minRows={0}
              emptyTitle="이 결제로 움직인 노트가 없습니다."
            />
          </Card>

          {pastAnomalies.length > 0 && (
            <Card title="지난 이상 기록" bodyClassName="px-5 py-1">
              {pastAnomalies.map((item) => (
                <InfoRow
                  key={item.anomalyId}
                  label={PAYMENT_ANOMALY_LABEL[item.type]}
                  value={
                    <span>
                      {item.resolutionMemo}
                      <span className="ml-2 body-6 text-font-2">
                        {item.resolvedBy} · {formatDateTime(item.resolvedAt)}
                      </span>
                    </span>
                  }
                />
              ))}
            </Card>
          )}

          <AnomalyResolveModal
            anomaly={resolveTarget?.anomaly ?? null}
            mode={resolveTarget?.mode ?? "CLEAR"}
            onClose={() => setResolveTarget(null)}
            onSubmit={handleResolve}
            isSubmitting={resolveMutation.isPending}
          />

          <ManualCancelModal
            order={isManualCancelOpen ? order : null}
            onClose={() => setIsManualCancelOpen(false)}
            onSubmit={handleManualCancel}
            isSubmitting={manualCancelMutation.isPending}
          />

          <AdminRefundModal
            order={isAdminRefundOpen ? order : null}
            onClose={() => setIsAdminRefundOpen(false)}
            onSubmit={handleAdminRefund}
            isSubmitting={adminRefundMutation.isPending}
          />

          <RefundRejectModal
            refund={
              rejectTarget
                ? {
                    refundId: rejectTarget.refundId,
                    userNickname: nickname,
                    orderUid: order.orderUid,
                    productName: order.productName,
                    refundAmount: rejectTarget.refundAmount,
                  }
                : null
            }
            onClose={() => setRejectTarget(null)}
            onSubmit={handleReject}
            isSubmitting={rejectMutation.isPending}
          />
        </>
      )}
    </>
  );
};

export default PaymentOrderDetailView;
