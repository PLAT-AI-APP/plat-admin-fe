"use client";

import { useState } from "react";
import {
  usePaymentRecordListQuery,
  type PaymentRecordMemberFilter,
} from "@/api/billing/getPaymentRecordList";
import { useListParams } from "@/hooks/useListParams";
import type { CsvColumn } from "@/lib/csv";
import { formatDate, formatDateTimeSecond } from "@/lib/dayjs";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  PaymentRecord,
  PaymentRecordStatus,
  PgProvider,
} from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import PaymentRecordDetailModal from "./PaymentRecordDetailModal";
import PaymentRecordSummaryCards from "./PaymentRecordSummaryCards";
import {
  EXPIRING_DAYS,
  MEMBER_FILTER_OPTIONS,
  PAYMENT_METHOD_LABEL,
  PG_PROVIDER_LABEL,
  PROVIDER_FILTER_OPTIONS,
  RECORD_STATUS_FILTER_OPTIONS,
  RECORD_STATUS_LABEL,
  RECORD_STATUS_TONE,
  RETENTION_BASIS,
  RETENTION_YEARS,
  retentionDaysLeft,
} from "./recordOptions";

/**
 * CSV 컬럼.
 *
 * 감사·실사에 그대로 제출하는 파일이라 표에 보이는 값에 더해 **보존 근거와
 * 파기 상태까지** 넣는다. 화면 밖으로 나간 뒤에는 "이게 왜 남아 있는 기록인지"를
 * 파일만 보고 설명할 수 있어야 한다.
 */
const CSV_COLUMNS: CsvColumn<PaymentRecord>[] = [
  { header: "상태", value: (row) => RECORD_STATUS_LABEL[row.status] },
  { header: "PG 거래번호", value: (row) => row.pgTid },
  { header: "주문번호", value: (row) => row.merchantOrderId },
  { header: "승인번호", value: (row) => row.approvalNo ?? "" },
  { header: "결제사", value: (row) => PG_PROVIDER_LABEL[row.pgProvider] },
  { header: "결제수단", value: (row) => PAYMENT_METHOD_LABEL[row.method] },
  { header: "상품명", value: (row) => row.productName },
  { header: "상품코드", value: (row) => row.productCode },
  { header: "지급 크레딧", value: (row) => row.credit },
  { header: "결제금액", value: (row) => row.amount },
  { header: "부가세", value: (row) => row.vatAmount },
  { header: "환불금액", value: (row) => row.refundedAmount },
  { header: "승인일시", value: (row) => formatDateTimeSecond(row.approvedAt) },
  {
    header: "최종 변경일시",
    value: (row) => formatDateTimeSecond(row.lastEventAt),
  },
  { header: "회원 해시", value: (row) => row.userKey },
  { header: "탈퇴 여부", value: (row) => (row.isWithdrawn ? "탈퇴" : "이용 중") },
  { header: "개인정보 파기일", value: (row) => formatDate(row.purgedAt) },
  { header: "보존 만료일", value: (row) => formatDate(row.retentionUntil) },
  { header: "보존 근거", value: () => RETENTION_BASIS },
];

/** 주소에 실리는 목록 조건. 조회 키를 링크로 그대로 넘길 수 있어야 한다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  provider: "",
  status: "",
  member: "",
  startDate: "",
  endDate: "",
};

/**
 * 결제 보존 원장.
 *
 * 다른 목록과 조회 방식이 다르다. **유저로 찾을 수 없다** — 이 화면에 남아 있는
 * 대부분의 건은 회원이 이미 파기되어 닉네임도 이메일도 없다. 그래서 검색은
 * 결제사 거래번호를 첫 자리에 두고, 필터도 결제사 · 상태 · 회원 상태로 짠다.
 */
const PaymentRecordManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, startDate, endDate } = params;
  const provider = params.provider as PgProvider | "";
  const status = params.status as PaymentRecordStatus | "";
  const member = params.member as PaymentRecordMemberFilter;

  const [detailRecord, setDetailRecord] = useState<PaymentRecord | null>(null);

  const { data, isLoading, isError } = usePaymentRecordListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    provider,
    status,
    member,
    startDate,
    endDate,
  });

  const records = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;

  const columns: TableColumn<PaymentRecord>[] = [
    {
      key: "status",
      header: "상태",
      width: "90px",
      render: (record) => (
        <Badge tone={RECORD_STATUS_TONE[record.status]}>
          {RECORD_STATUS_LABEL[record.status]}
        </Badge>
      ),
    },
    {
      key: "pgTid",
      header: "PG 거래번호",
      width: "240px",
      render: (record) => (
        <TableCellStack
          primary={
            <code className="body-5 break-all text-font-1">{record.pgTid}</code>
          }
          secondary={record.merchantOrderId}
        />
      ),
    },
    {
      key: "provider",
      header: "결제사 · 수단",
      width: "140px",
      render: (record) => (
        <TableCellStack
          primary={PG_PROVIDER_LABEL[record.pgProvider]}
          secondary={
            record.cardIssuer
              ? `${PAYMENT_METHOD_LABEL[record.method]} · ${record.cardIssuer}`
              : PAYMENT_METHOD_LABEL[record.method]
          }
        />
      ),
    },
    {
      key: "product",
      header: "상품",
      width: "140px",
      render: (record) => (
        <TableCellStack
          primary={record.productName}
          secondary={record.productCode}
        />
      ),
    },
    {
      key: "amount",
      header: "결제금액",
      width: "120px",
      align: "right",
      numeric: true,
      render: (record) => (
        <TableCellStack
          primary={
            <span className="font-medium">{formatCurrency(record.amount)}</span>
          }
          secondary={
            record.refundedAmount > 0 ? (
              <span className="text-danger">
                -{formatCurrency(record.refundedAmount)}
              </span>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "member",
      header: "회원",
      width: "160px",
      render: (record) => (
        <TableCellStack
          primary={
            record.isWithdrawn ? (
              <Badge tone="neutral">탈퇴</Badge>
            ) : (
              <Badge tone="info">이용 중</Badge>
            )
          }
          /* 파기가 끝난 건은 해시만 남는다. 그 사실이 목록에서 바로 보여야 한다. */
          secondary={
            record.userNickname ? (
              `${record.userNickname} (#${record.userId})`
            ) : (
              <code className="body-6">{record.userKey}</code>
            )
          }
        />
      ),
    },
    {
      key: "approvedAt",
      header: "승인일시",
      width: "165px",
      numeric: true,
      render: (record) => (
        <span className="text-font-2">
          {formatDateTimeSecond(record.approvedAt)}
        </span>
      ),
    },
    {
      key: "retentionUntil",
      header: "보존 만료",
      width: "140px",
      numeric: true,
      render: (record) => {
        const daysLeft = retentionDaysLeft(record.retentionUntil);
        const isExpiring = daysLeft <= EXPIRING_DAYS;

        return (
          <TableCellStack
            primary={
              <span className={isExpiring ? "text-warning" : "text-font-2"}>
                {formatDate(record.retentionUntil)}
              </span>
            }
            secondary={
              daysLeft > 0 ? `${formatWithCommas(daysLeft)}일 남음` : "파기 대상"
            }
          />
        );
      },
    },
  ];

  return (
    <>
      <PaymentRecordSummaryCards />

      {/*
        이 화면은 "왜 아직 남아 있는가"를 먼저 설명해야 한다. 개인정보를 파기했다고
        안내한 뒤에도 결제 기록이 남아 있는 것은 다른 법이 그렇게 시키기 때문이고,
        그 범위를 넘어선 값이 여기 있으면 안 된다.
      */}
      <Alert
        tone="info"
        title={`탈퇴 · 파기 이후에도 ${RETENTION_YEARS}년간 보관하는 결제 기록입니다.`}
      >
        {RETENTION_BASIS}에 따라 보존합니다. 이름 · 연락처 · 이메일 · 카드번호 등
        회원을 특정하는 값은 파기 시점에 함께 삭제되며, 거래를 특정하는 결제사
        고유값과 공급 내역 · 금액 · 상태만 남습니다. 조회는 PG 거래번호 · 주문번호
        · 승인번호로 합니다.
      </Alert>

      {isError && (
        <Alert tone="danger" title="보존 원장을 불러오지 못했습니다.">
          잠시 후 검색 조건을 다시 적용해 주세요. 계속 실패하면 관제 채널에
          공유해 주세요.
        </Alert>
      )}

      <Card
        title={`보존 원장 ${formatWithCommas(totalCount)}건`}
        description="한 줄을 누르면 거래 이력과 보존 정보를 볼 수 있습니다."
        action={
          <CsvExportButton
            fileName="결제보존원장"
            rows={records}
            columns={CSV_COLUMNS}
            disabled={isLoading}
          />
        }
        noPadding
      >
        {/* 필터가 넷이라 좁은 화면에서는 줄을 바꾼다. 검색칸을 줄이면 안 된다 —
            30자리 거래번호를 넣고 눈으로 대조하는 칸이다. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="PG 거래번호 · 주문번호 · 승인번호 · 회원 해시로 조회"
            boxClassName="w-88 shrink-0"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="회원 상태 필터"
              options={MEMBER_FILTER_OPTIONS}
              value={member}
              onChange={(event) => setParams({ member: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              aria-label="결제사 필터"
              options={PROVIDER_FILTER_OPTIONS}
              value={provider}
              onChange={(event) => setParams({ provider: event.target.value })}
              selectBoxClassName="w-40"
            />

            <Select
              aria-label="결제 상태 필터"
              options={RECORD_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => setParams({ status: event.target.value })}
              selectBoxClassName="w-32"
            />

            {/* 기간은 승인일 기준이다. 취소·환불일로 찾으면 결제일이 흩어진다. */}
            <DateRangeFilter
              value={{ startDate, endDate }}
              onChange={(range) => setParams(range)}
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={records}
          getRowKey={(record) => String(record.recordId)}
          isLoading={isLoading}
          onRowClick={setDetailRecord}
          emptyTitle="조회된 결제 기록이 없습니다."
          emptyDescription="거래번호는 결제사에서 발급한 값 그대로 입력해 주세요. 기간·필터를 넓혀 다시 조회할 수도 있습니다."
        />

        {totalCount > 0 && (
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onChange={(next) => setParams({ page: next })}
          />
        )}
      </Card>

      <PaymentRecordDetailModal
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </>
  );
};

export default PaymentRecordManager;
