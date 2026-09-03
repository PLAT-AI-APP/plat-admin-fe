"use client";

import Link from "next/link";
import { useState } from "react";
import { useCreditAdjustmentListQuery } from "@/api/billing/getCreditAdjustmentList";
import { useLedgerListQuery } from "@/api/billing/getLedgerList";
import { usePaymentRecordListQuery } from "@/api/billing/getPaymentRecordList";
import { ExternalLink } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { formatAdmin, formatCurrency, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import type {
  CreditAdjustment,
  LedgerEntry,
  PaymentRecord,
} from "@/type/billing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import {
  ADJUSTMENT_TYPE_LABEL,
  ADJUSTMENT_TYPE_SIGN,
  ADJUSTMENT_TYPE_TONE,
} from "../../../billing/credit-adjustments/_components/adjustmentOptions";
import {
  LEDGER_TYPE_LABEL,
  LEDGER_TYPE_TONE,
} from "../../../billing/ledger/_components/ledgerOptions";
import PaymentRecordDetailModal from "../../../billing/retention/_components/PaymentRecordDetailModal";
import {
  PAYMENT_METHOD_LABEL,
  PG_PROVIDER_LABEL,
  RECORD_STATUS_LABEL,
  RECORD_STATUS_TONE,
} from "../../../billing/retention/_components/recordOptions";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserBillingPanelProps {
  userId: string;
}

/** 크레딧 증감은 부호를 앞에 붙이고 색으로 방향을 먼저 읽게 한다. */
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
      {value > 0 ? "+" : "-"}
      {formatWithCommas(Math.abs(value))}
    </span>
  );
};

/**
 * 이 유저의 결제 장부 · 크레딧 수동 조정 이력 · 결제 보존 원장.
 * 세 목록의 성격이 달라 한 탭 안에서 카드로 나눠 보여준다.
 */
const UserBillingPanel = ({ userId }: UserBillingPanelProps) => {
  const [ledgerPage, setLedgerPage] = useState(1);
  const [adjustmentPage, setAdjustmentPage] = useState(1);
  const [recordPage, setRecordPage] = useState(1);
  const [detailRecord, setDetailRecord] = useState<PaymentRecord | null>(null);

  /*
    원장은 장부와 권한이 다르다. 없으면 카드 자체를 감춘다 — 빈 표를 남기면
    "이 유저는 결제 기록이 없다"로 읽혀 장부와 어긋나 보인다.
  */
  const canReadRecord = useHasPermission("paymentRecord:read");

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

  const { data: records, isLoading: isRecordLoading } =
    usePaymentRecordListQuery({
      page: recordPage,
      size: USER_DETAIL_PAGE_SIZE,
      userId,
    });

  /* 파기가 끝나면 해시가 유일한 조회 키다. 전체 원장으로 건너갈 때도 이 값을 쓴다. */
  const userKey = records?.content[0]?.userKey;

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
      render: (row) => <span className="body-5">{row.memo}</span>,
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
   * 보존 원장 컬럼.
   *
   * 원장 화면과 달리 회원 컬럼을 두지 않는다 — 이미 이 유저의 화면이다.
   * 대신 **PG 거래번호를 앞에 세운다.** 여기서 이 카드를 여는 이유가
   * "이 유저의 결제를 결제사에 문의해야 한다"이기 때문이다.
   */
  const recordColumns: TableColumn<PaymentRecord>[] = [
    {
      key: "status",
      header: "상태",
      width: "90px",
      render: (row) => (
        <Badge tone={RECORD_STATUS_TONE[row.status]}>
          {RECORD_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "pgTid",
      header: "PG 거래번호",
      width: "230px",
      render: (row) => (
        <TableCellStack
          primary={
            <code className="body-5 break-all text-font-1">{row.pgTid}</code>
          }
          secondary={row.merchantOrderId}
        />
      ),
    },
    {
      key: "provider",
      header: "결제사 · 수단",
      width: "140px",
      render: (row) => (
        <TableCellStack
          primary={PG_PROVIDER_LABEL[row.pgProvider]}
          secondary={
            row.cardIssuer
              ? `${PAYMENT_METHOD_LABEL[row.method]} · ${row.cardIssuer}`
              : PAYMENT_METHOD_LABEL[row.method]
          }
        />
      ),
    },
    {
      key: "product",
      header: "상품",
      render: (row) => (
        <TableCellStack primary={row.productName} secondary={row.productCode} />
      ),
    },
    {
      key: "amount",
      header: "결제 금액",
      align: "right",
      numeric: true,
      width: "120px",
      render: (row) => (
        <TableCellStack
          primary={
            <span className="font-medium">{formatCurrency(row.amount)}</span>
          }
          secondary={
            row.refundedAmount > 0 ? (
              <span className="text-danger">
                -{formatCurrency(row.refundedAmount)}
              </span>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "approvedAt",
      header: "승인일시",
      align: "right",
      numeric: true,
      width: "150px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDateTime(row.approvedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={`결제 장부 ${formatWithCommas(ledger?.totalCount ?? 0)}건`}
        description="결제 · 충전 · 사용 · 환불이 시간순으로 쌓입니다."
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

      {/*
        장부와 겹쳐 보이지만 답하는 질문이 다르다. 장부는 "크레딧이 어떻게 오갔나"고,
        원장은 "이 결제를 결제사에 어떻게 특정하나"다. 결제사 거래번호 · 승인번호는
        장부에 없어서, 이 카드가 없으면 문의 한 건마다 원장 화면에서 다시 찾아야 한다.
        탈퇴하면 이 유저 화면은 사라지지만 아래 기록은 5년간 남는다.
      */}
      {canReadRecord && (
        <Card
          title={`결제 보존 원장 ${formatWithCommas(records?.totalCount ?? 0)}건`}
          description="법정 보존 기록입니다. 탈퇴 · 파기 후에도 결제사 거래번호로 조회할 수 있습니다."
          action={
            userKey && (
              <Link
                href={`/billing/retention?keyword=${encodeURIComponent(userKey)}`}
                className="flex items-center gap-1 body-5 text-font-2 transition hover:text-brand"
              >
                보존 원장에서 보기
                <ExternalLink size={12} />
              </Link>
            )
          }
          noPadding
        >
          <Table
            columns={recordColumns}
            rows={records?.content ?? []}
            getRowKey={(row) => String(row.recordId)}
            isLoading={isRecordLoading}
            skeletonRows={3}
            onRowClick={setDetailRecord}
            emptyTitle="보존 중인 결제 기록이 없습니다."
            emptyDescription="이 유저가 결제한 적이 없거나, 보존 기간(5년)이 지나 파기되었습니다."
          />

          <Pagination
            page={recordPage}
            totalCount={records?.totalCount ?? 0}
            pageSize={USER_DETAIL_PAGE_SIZE}
            onChange={setRecordPage}
          />
        </Card>
      )}

      <PaymentRecordDetailModal
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
};

export default UserBillingPanel;
