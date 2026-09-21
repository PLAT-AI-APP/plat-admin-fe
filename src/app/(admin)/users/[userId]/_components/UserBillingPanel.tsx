"use client";

import Link from "next/link";
import { useState } from "react";
import { useCreditAdjustmentListQuery } from "@/api/billing/getCreditAdjustmentList";
import { useLedgerListQuery } from "@/api/billing/getLedgerList";
import { usePaymentOrderListQuery } from "@/api/billing/getPaymentOrderList";
import { usePaymentOrderSummaryQuery } from "@/api/billing/getPaymentOrderSummary";
import { ExternalLink } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import {
  formatAdmin,
  formatCredit,
  formatCurrency,
  formatSignedCredit,
  formatWithCommas,
} from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import type {
  CreditAdjustment,
  LedgerEntry,
  PaymentOrderListItem,
} from "@/type/billing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import PaymentStatusCell from "@/app/(admin)/billing/payments/_components/PaymentStatusCell";
import {
  ADJUSTMENT_TYPE_LABEL,
  ADJUSTMENT_TYPE_SIGN,
  ADJUSTMENT_TYPE_TONE,
  LEDGER_TYPE_LABEL,
  LEDGER_TYPE_TONE,
  PAYMENT_PG_PROVIDER_LABEL,
} from "@/constants/billingOptions";
import { USER_DETAIL_PAGE_SIZE } from "@/app/(admin)/users/[userId]/_constants/userDetailOptions";

interface UserBillingPanelProps {
  userId: string;
}

/**
 * 크레딧 증감은 부호를 앞에 붙이고 색으로 방향을 먼저 읽게 한다.
 * 이 카드의 다른 크레딧 열(조정 후 잔액 등)이 단위 없이 숫자만 적어 여기도 " CR"을 뗀다.
 */
const CreditDelta = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-font-disabled">-</span>;

  return (
    <span
      className={
        value > 0
          ? "font-medium text-success tabular-nums"
          : "font-medium text-danger tabular-nums"
      }
    >
      {formatSignedCredit(value, { withUnit: false })}
    </span>
  );
};

/**
 * 이 유저의 결제 내역 · 크레딧 원장 · 크레딧 수동 조정 이력.
 * 세 목록의 성격이 달라 한 탭 안에서 카드로 나눠 보여준다.
 */
const UserBillingPanel = ({ userId }: UserBillingPanelProps) => {
  const [ledgerPage, setLedgerPage] = useState(1);
  const [adjustmentPage, setAdjustmentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);

  /*
    권한이 없으면 카드 자체를 감춘다 — 빈 표를 남기면 "이 유저는 결제 기록이
    없다"로 읽혀 장부와 어긋나 보인다.
  */
  const canReadPayment = useHasPermission("payment:read");

  const { data: ledger, isLoading: isLedgerLoading } = useLedgerListQuery({
    page: ledgerPage,
    size: USER_DETAIL_PAGE_SIZE,
    userId,
  });

  const { data: adjustments, isLoading: isAdjustmentLoading } =
    useCreditAdjustmentListQuery({
      page: adjustmentPage,
      size: USER_DETAIL_PAGE_SIZE,
      userId,
    });

  const { data: payments, isLoading: isPaymentLoading } =
    usePaymentOrderListQuery({
      page: paymentPage,
      size: USER_DETAIL_PAGE_SIZE,
      tab: "ALL",
      userId,
    });

  const { data: paymentSummary } = usePaymentOrderSummaryQuery(userId);
  const issueCount = paymentSummary?.issueCount ?? 0;
  const refundRequestedCount = paymentSummary?.refundRequestedCount ?? 0;

  const ledgerColumns: TableColumn<LedgerEntry>[] = [
    {
      key: "type",
      header: "유형",
      width: "100px",
      render: (row) => (
        <Badge tone={LEDGER_TYPE_TONE[row.type]}>
          {LEDGER_TYPE_LABEL[row.type]}
        </Badge>
      ),
    },
    {
      key: "productName",
      header: "상품",
      width: "160px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {row.productName ?? "-"}
        </span>
      ),
    },
    {
      key: "memo",
      header: "메모",
      render: (row) => (
        <span className="flex items-center gap-2 body-5">
          {row.memo}
          {/* 결제에서 나온 줄은 그 결제로 건너간다. 환불 · 이상 여부는 결제 상세가 원본이다. */}
          {row.paymentOrderId && (
            <Link
              href={`/billing/payments/${row.paymentOrderId}`}
              className="inline-flex shrink-0 items-center gap-0.5 body-6 text-font-2 transition hover:text-brand"
            >
              결제 보기
              <ExternalLink size={11} />
            </Link>
          )}
        </span>
      ),
    },
    {
      key: "amount",
      header: "결제 금액",
      align: "right",
      numeric: true,
      width: "110px",
      render: (row) =>
        row.amount === 0 ? (
          <span className="text-font-disabled">-</span>
        ) : (
          formatCurrency(row.amount)
        ),
    },
    {
      key: "creditDelta",
      header: "크레딧 증감",
      align: "right",
      numeric: true,
      width: "110px",
      render: (row) => <CreditDelta value={row.creditDelta} />,
    },
    {
      key: "createdAt",
      header: "일시",
      align: "right",
      numeric: true,
      width: "150px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  const adjustmentColumns: TableColumn<CreditAdjustment>[] = [
    {
      key: "type",
      header: "유형",
      width: "90px",
      render: (row) => (
        <Badge tone={ADJUSTMENT_TYPE_TONE[row.type]}>
          {ADJUSTMENT_TYPE_LABEL[row.type]}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "금액",
      align: "right",
      numeric: true,
      width: "110px",
      render: (row) => (
        <span
          className={
            row.type === "GRANT"
              ? "font-medium text-success"
              : "font-medium text-danger"
          }
        >
          {ADJUSTMENT_TYPE_SIGN[row.type]}
          {formatWithCommas(row.amount)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "사유",
      render: (row) => <span className="body-5">{row.reason}</span>,
    },
    {
      key: "balanceAfter",
      header: "조정 후 잔액",
      align: "right",
      numeric: true,
      width: "120px",
      render: (row) => formatWithCommas(row.balanceAfter),
    },
    {
      key: "processedBy",
      header: "처리자",
      width: "100px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatAdmin(row.processedBy, row.processedById)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "일시",
      align: "right",
      numeric: true,
      width: "150px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  /**
   * 결제 내역 컬럼.
   *
   * 회원 컬럼을 두지 않는다 — 이미 이 유저의 화면이다. 대신 **PG 거래번호를 함께 세운다.**
   * 여기서 이 카드를 여는 흔한 이유가 "이 유저의 결제를 결제사에 문의해야 한다"이기 때문이다.
   */
  const paymentColumns: TableColumn<PaymentOrderListItem>[] = [
    {
      key: "requestedAt",
      header: "주문일",
      width: "140px",
      numeric: true,
      render: (row) => (
        <span className="body-5 text-font-2">{formatDateTime(row.requestedAt)}</span>
      ),
    },
    {
      key: "order",
      header: "주문",
      render: (row) => (
        <TableCellStack
          primary={row.productName}
          secondary={
            <code className="break-all">{row.pgTransactionId ?? row.orderUid}</code>
          }
        />
      ),
    },
    {
      key: "amount",
      header: "금액",
      align: "right",
      numeric: true,
      width: "120px",
      render: (row) => (
        <TableCellStack
          primary={<span className="font-medium">{formatCurrency(row.amount)}</span>}
          secondary={
            row.refundedAmount > 0 ? (
              <span className="text-danger">-{formatCurrency(row.refundedAmount)}</span>
            ) : (
              formatCredit(row.creditAmount)
            )
          }
        />
      ),
    },
    {
      key: "pg",
      header: "PG",
      width: "110px",
      render: (row) => (
        <span className="body-5">{PAYMENT_PG_PROVIDER_LABEL[row.pgProvider]}</span>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "170px",
      render: (row) => <PaymentStatusCell order={row} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/*
        결제 한 건의 승인 · 지급 · 환불 · 보존은 결제 내역이 원본이다. 이 카드에서 행을 누르면
        그 결제의 상세로 간다. 탈퇴하면 이 유저 화면은 사라지지만 결제 기록은 5년간 남는다.
      */}
      {canReadPayment && (
        <Card
          title={
            /*
              처리할 일이 있으면 제목 옆에 바로 보인다. 이 탭은 유저 문의를 받고 여는 일이 많아,
              표를 훑기 전에 "이 유저에게 걸린 게 있나"부터 알아야 한다.
            */
            <span className="flex flex-wrap items-center gap-2">
              결제 내역 {formatWithCommas(payments?.totalCount ?? 0)}건
              {issueCount > 0 && (
                <Link href={`/billing/payments?tab=ISSUE&userId=${encodeURIComponent(userId)}`}>
                  <Badge tone="danger">확인 필요 {formatWithCommas(issueCount)}</Badge>
                </Link>
              )}
              {refundRequestedCount > 0 && (
                <Link
                  href={`/billing/payments?tab=REFUND_REQUESTED&userId=${encodeURIComponent(userId)}`}
                >
                  <Badge tone="warning">환불 대기 {formatWithCommas(refundRequestedCount)}</Badge>
                </Link>
              )}
            </span>
          }
          description="승인 · 노트 지급 · 환불 · 보존을 결제 한 건 단위로 봅니다. 행을 누르면 결제 상세로 갑니다."
          action={
            <div className="flex items-center gap-3">
              <Link
                href={`/billing/payments?tab=REFUND_REQUESTED&userId=${encodeURIComponent(userId)}`}
                className="flex items-center gap-1 body-5 text-font-2 transition hover:text-brand"
              >
                환불 요청
                <ExternalLink size={12} />
              </Link>
              <Link
                href={`/billing/payments?userId=${encodeURIComponent(userId)}`}
                className="flex items-center gap-1 body-5 text-font-2 transition hover:text-brand"
              >
                결제 내역에서 보기
                <ExternalLink size={12} />
              </Link>
            </div>
          }
          noPadding
        >
          <Table
            columns={paymentColumns}
            rows={payments?.content ?? []}
            getRowKey={(row) => row.paymentOrderId}
            isLoading={isPaymentLoading}
            skeletonRows={3}
            getRowHref={(row) => `/billing/payments/${row.paymentOrderId}`}
            emptyTitle="결제 기록이 없습니다."
            emptyDescription="이 유저가 결제한 적이 없거나, 보존 기간(5년)이 지나 파기되었습니다."
          />

          <Pagination
            page={paymentPage}
            totalCount={payments?.totalCount ?? 0}
            pageSize={USER_DETAIL_PAGE_SIZE}
            onChange={setPaymentPage}
          />
        </Card>
      )}

      <Card
        title={`크레딧 원장 ${formatWithCommas(ledger?.totalCount ?? 0)}건`}
        description="충전 · 사용 · 만료 · 환불 회수 · 수동 조정으로 잔액이 움직인 줄이 시간순으로 쌓입니다."
        noPadding
      >
        <Table
          columns={ledgerColumns}
          rows={ledger?.content ?? []}
          getRowKey={(row) => String(row.ledgerId)}
          isLoading={isLedgerLoading}
          skeletonRows={4}
          emptyTitle="결제 · 크레딧 내역이 없습니다."
          emptyDescription="이 유저의 장부에 아직 기록이 없습니다."
        />

        <Pagination
          page={ledgerPage}
          totalCount={ledger?.totalCount ?? 0}
          pageSize={USER_DETAIL_PAGE_SIZE}
          onChange={setLedgerPage}
        />
      </Card>

      <Card
        title={`크레딧 수동 조정 ${formatWithCommas(adjustments?.totalCount ?? 0)}건`}
        description="운영자가 직접 지급하거나 차감한 이력입니다."
        noPadding
      >
        <Table
          columns={adjustmentColumns}
          rows={adjustments?.content ?? []}
          getRowKey={(row) => String(row.adjustmentId)}
          isLoading={isAdjustmentLoading}
          skeletonRows={3}
          emptyTitle="수동 조정 이력이 없습니다."
          emptyDescription="운영자가 크레딧을 직접 조정한 적이 없습니다."
        />

        <Pagination
          page={adjustmentPage}
          totalCount={adjustments?.totalCount ?? 0}
          pageSize={USER_DETAIL_PAGE_SIZE}
          onChange={setAdjustmentPage}
        />
      </Card>

    </div>
  );
};

export default UserBillingPanel;
