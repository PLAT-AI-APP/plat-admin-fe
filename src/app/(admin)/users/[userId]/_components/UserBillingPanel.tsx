"use client";

import { useState } from "react";
import { useCreditAdjustmentListQuery } from "@/api/billing/getCreditAdjustmentList";
import { useLedgerListQuery } from "@/api/billing/getLedgerList";
import { formatDateTime } from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import type { CreditAdjustment, LedgerEntry } from "@/type/billing";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  ADJUSTMENT_TYPE_LABEL,
  ADJUSTMENT_TYPE_SIGN,
  ADJUSTMENT_TYPE_TONE,
} from "../../../billing/credit-adjustments/_components/adjustmentOptions";
import {
  LEDGER_TYPE_LABEL,
  LEDGER_TYPE_TONE,
} from "../../../billing/ledger/_components/ledgerOptions";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserBillingPanelProps {
  userId: number;
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
 * 이 유저의 결제 장부와 크레딧 수동 조정 이력.
 * 두 목록의 성격이 달라 한 탭 안에서 카드 두 개로 나눠 보여준다.
 */
const UserBillingPanel = ({ userId }: UserBillingPanelProps) => {
  const [ledgerPage, setLedgerPage] = useState(1);
  const [adjustmentPage, setAdjustmentPage] = useState(1);

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
        <span className="text-[13px] text-font-2">
          {row.productName ?? "-"}
        </span>
      ),
    },
    {
      key: "memo",
      header: "메모",
      render: (row) => <span className="text-[13px]">{row.memo}</span>,
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
        <span className="text-[13px] text-font-2">
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
      render: (row) => <span className="text-[13px]">{row.reason}</span>,
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
        <span className="text-[13px] text-font-2">{row.processedBy}</span>
      ),
    },
    {
      key: "createdAt",
      header: "일시",
      align: "right",
      numeric: true,
      width: "150px",
      render: (row) => (
        <span className="text-[13px] text-font-2">
          {formatDateTime(row.createdAt)}
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
    </div>
  );
};

export default UserBillingPanel;
