"use client";

import Link from "next/link";
import { usePaymentOrderListQuery } from "@/api/billing/getPaymentOrderList";
import { usePaymentOrderSummaryQuery } from "@/api/billing/getPaymentOrderSummary";
import { useListParams } from "@/hooks/useListParams";
import { Refresh, Warning } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import {
  cn,
  formatCredit,
  formatCurrency,
  formatWithCommas,
  truncate,
} from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  PaymentAnomalyType,
  PaymentOrderListItem,
  PaymentOrderTab,
  PaymentPgProvider,
  PaymentStatus,
} from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import PaymentStatusCell from "./PaymentStatusCell";
import {
  FULFILLMENT_STATUS_LABEL,
  PAYMENT_ANOMALY_LABEL,
  PAYMENT_ANOMALY_ORDER,
  PAYMENT_ORDER_METHOD_LABEL,
  PAYMENT_PG_PROVIDER_FILTER_OPTIONS,
  PAYMENT_PG_PROVIDER_LABEL,
  PAYMENT_STATUS_FILTER_OPTIONS,
  PAYMENT_STATUS_LABEL,
  REFUND_STATUS_LABEL,
  RETENTION_BASIS,
  RETENTION_FILTER_OPTIONS,
  EXPIRING_DAYS,
  retentionDaysLeft,
} from "@/constants/billingOptions";

/** CSV는 정산 · 감사에 그대로 쓰므로 거래번호와 유저 ID까지 담는다. */
const CSV_COLUMNS: CsvColumn<PaymentOrderListItem>[] = [
  { header: "주문일", value: (row) => formatDateTime(row.requestedAt) },
  { header: "승인일", value: (row) => (row.paidAt ? formatDateTime(row.paidAt) : "") },
  { header: "주문번호", value: (row) => row.orderUid },
  { header: "PG", value: (row) => PAYMENT_PG_PROVIDER_LABEL[row.pgProvider] },
  { header: "PG 거래번호", value: (row) => row.pgTransactionId ?? "" },
  {
    header: "결제수단",
    value: (row) =>
      row.paymentMethod ? PAYMENT_ORDER_METHOD_LABEL[row.paymentMethod] : "",
  },
  { header: "상품", value: (row) => row.productName },
  { header: "주문 금액", value: (row) => row.amount },
  { header: "승인 금액", value: (row) => row.paidAmount },
  { header: "환불 금액", value: (row) => row.refundedAmount },
  { header: "지급 노트", value: (row) => row.creditAmount },
  { header: "결제 상태", value: (row) => PAYMENT_STATUS_LABEL[row.paymentStatus] },
  {
    header: "지급 상태",
    value: (row) => FULFILLMENT_STATUS_LABEL[row.fulfillmentStatus],
  },
  {
    header: "환불 요청",
    value: (row) => (row.refundStatus ? REFUND_STATUS_LABEL[row.refundStatus] : ""),
  },
  {
    header: "확인 필요",
    value: (row) =>
      row.openAnomalyTypes.map((type) => PAYMENT_ANOMALY_LABEL[type]).join(", "),
  },
  { header: "유저 ID", value: (row) => row.userId },
  { header: "탈퇴", value: (row) => (row.isWithdrawn ? "Y" : "") },
  /*
    감사 · 실사에 그대로 내는 파일이다. 화면 밖으로 나간 뒤에도 "왜 아직 남아 있는
    기록인지"를 파일만 보고 설명할 수 있어야 해서 만료일과 근거 조항을 싣는다.
  */
  { header: "보존 만료일", value: (row) => formatDate(row.retentionUntil) },
  { header: "보존 근거", value: () => RETENTION_BASIS },
];

/**
 * 주소에 실리는 목록 조건.
 *
 * 처음에는 **전체**를 연다. 이 화면을 여는 가장 흔한 이유는 "이 주문 어떻게 됐나요"
 * 문의라 번호로 바로 찾을 수 있어야 한다. 처리할 일은 상단 경고와 탭 숫자가 알린다.
 */
const DEFAULT_PARAMS = {
  page: 1,
  tab: "ALL",
  keyword: "",
  pgProvider: "",
  paymentStatus: "",
  anomalyType: "",
  startDate: "",
  endDate: "",
  /** 유저 상세에서 넘어온 드릴다운 */
  userId: "",
  /** 보존 기간. `EXPIRING`이면 만료 임박만 */
  retention: "",
};

/** 탭마다 표 제목과 빈 목록 문구가 다르다. 같은 표를 보고 있다는 것은 유지한다. */
const TAB_COPY: Record<PaymentOrderTab, { title: string; empty: string }> = {
  ALL: { title: "결제", empty: "조건에 맞는 결제가 없습니다." },
  ISSUE: { title: "확인이 필요한 결제", empty: "확인이 필요한 결제가 없습니다." },
  REFUND_REQUESTED: {
    title: "환불 승인 대기",
    empty: "승인을 기다리는 환불이 없습니다.",
  },
  WITHDRAWN: { title: "탈퇴 회원 결제", empty: "탈퇴 회원의 결제가 없습니다." },
};

const PaymentOrderManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, startDate, endDate, userId } = params;
  const tab = params.tab as PaymentOrderTab;
  const pgProvider = params.pgProvider as PaymentPgProvider | "";
  const paymentStatus = params.paymentStatus as PaymentStatus | "";
  const anomalyType = params.anomalyType as PaymentAnomalyType | "";
  const retention = params.retention as "EXPIRING" | "";

  const { data, isLoading, isError, error, isFetching, refetch } =
    usePaymentOrderListQuery({
      page,
      size: DEFAULT_PAGE_SIZE,
      tab,
      keyword,
      pgProvider,
      paymentStatus,
      // 유형 좁히기는 '확인 필요' 탭에서만 뜻이 있다. 다른 탭으로 옮기면 조용히 버린다.
      anomalyType: tab === "ISSUE" ? anomalyType : "",
      userId,
      retention,
      startDate,
      endDate,
    });
  const { data: summary } = usePaymentOrderSummaryQuery();

  const rows = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;
  const issueCount = summary?.issueCount ?? 0;
  const refundRequestedCount = summary?.refundRequestedCount ?? 0;
  const retentionExpiringCount = summary?.retentionExpiringCount ?? 0;
  /* 보존 만료일은 보존을 보려고 들어왔을 때만 칸을 낸다. 평소 목록에서는 자리만 차지한다. */
  const showsRetention = tab === "WITHDRAWN" || retention === "EXPIRING";

  const tabs: TabItem<PaymentOrderTab>[] = [
    { label: "전체", value: "ALL" },
    { label: "확인 필요", value: "ISSUE", count: summary?.issueCount },
    {
      label: "환불 요청",
      value: "REFUND_REQUESTED",
      count: summary?.refundRequestedCount,
    },
    { label: "탈퇴 회원", value: "WITHDRAWN", count: summary?.withdrawnCount },
  ];

  const columns: TableColumn<PaymentOrderListItem>[] = [
    {
      key: "requestedAt",
      header: "주문일",
      width: "140px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.requestedAt)}</span>
      ),
    },
    {
      key: "user",
      header: "유저",
      width: "170px",
      render: (row) =>
        row.isWithdrawn ? (
          /*
            탈퇴해 유저 화면은 없지만 결제 기록의 유저 ID는 남는다. 누르면 같은 사람의
            다른 결제를 모아 본다 — 문의가 여러 건에 걸쳐 있을 때 필요하다.
          */
          <TableCellStack
            primary={
              <span className="flex items-center gap-1">
                <span className="text-font-2">탈퇴 회원</span>
                <Badge tone="neutral">탈퇴</Badge>
              </span>
            }
            secondary={
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setParams({ userId: row.userId });
                }}
                className="transition hover:text-brand"
              >
                #{row.userId}
              </button>
            }
          />
        ) : (
          <TableCellStack
            // 유저 링크는 목록이 준 userId로만 건다.
            primary={
              <Link
                href={`/users/${row.userId}`}
                onClick={(event) => event.stopPropagation()}
                className="transition hover:text-brand"
              >
                {truncate(row.userNickname ?? `#${row.userId}`, 10)}
              </Link>
            }
            secondary={`#${row.userId}`}
          />
        ),
    },
    {
      key: "order",
      header: "주문",
      render: (row) => (
        <TableCellStack primary={row.productName} secondary={row.orderUid} />
      ),
    },
    {
      key: "amount",
      header: "금액",
      width: "130px",
      align: "right",
      numeric: true,
      render: (row) => {
        /*
          승인이 안 된 주문은 주문 금액을 흐리게 둔다. 합계로 읽히면 안 된다.
          다만 **줄을 긋는 것은 돈이 안 오간 것이 확정된 건뿐이다.** 결제창 대기 ·
          승인 결과 모름은 아직 모른다 — 특히 결과 모름은 유저 카드에 찍혔을 수 있다.
          열린 이상이 있으면 닫힌 건이라도 긋지 않는다(우리는 만료, PG는 승인인 대사 불일치).
        */
        const isPaid = row.paidAmount > 0;
        const isClosedUnpaid =
          !isPaid &&
          row.openAnomalyTypes.length === 0 &&
          ["FAILED", "CANCELLED", "EXPIRED"].includes(row.paymentStatus);

        return (
          <TableCellStack
            primary={
              <span
                className={cn(
                  "font-semibold",
                  !isPaid && "text-font-disabled",
                  isClosedUnpaid && "line-through",
                )}
              >
                {formatCurrency(isPaid ? row.paidAmount : row.amount)}
              </span>
            }
            secondary={
              row.refundedAmount > 0
                ? `환불 -${formatCurrency(row.refundedAmount)}`
                : `노트 ${formatCredit(row.creditAmount)}`
            }
          />
        );
      },
    },
    {
      key: "pg",
      header: "PG",
      width: "120px",
      render: (row) => (
        <TableCellStack
          primary={PAYMENT_PG_PROVIDER_LABEL[row.pgProvider]}
          secondary={
            row.paymentMethod
              ? PAYMENT_ORDER_METHOD_LABEL[row.paymentMethod]
              : undefined
          }
        />
      ),
    },
    ...(showsRetention
      ? [
          {
            key: "retention",
            header: "보존 만료",
            width: "130px",
            numeric: true,
            render: (row: PaymentOrderListItem) => {
              const daysLeft = retentionDaysLeft(row.retentionUntil);

              return (
                <TableCellStack
                  primary={formatDate(row.retentionUntil)}
                  secondary={
                    <span className={cn(daysLeft <= EXPIRING_DAYS && "font-medium text-danger")}>
                      D-{daysLeft}
                    </span>
                  }
                />
              );
            },
          },
        ]
      : []),
    {
      key: "status",
      header: "상태",
      width: "200px",
      render: (row) => <PaymentStatusCell order={row} />,
    },
  ];

  const copy = TAB_COPY[tab];

  return (
    <>
      {/*
        처리할 일이 있으면 어느 탭에 있든 먼저 알린다. 이 화면은 조회로 열리는 일이 많아,
        탭 숫자만으로는 노트를 못 받은 유저가 기다리고 있다는 것을 놓친다.
      */}
      {issueCount > 0 && tab !== "ISSUE" && (
        <Alert
          tone="danger"
          title={`확인이 필요한 결제가 ${formatWithCommas(issueCount)}건 있습니다.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setParams({ tab: "ISSUE" })}
            >
              확인 필요 보기
            </Button>
          }
        >
          {PAYMENT_ANOMALY_ORDER.filter(
            (type) => (summary?.issueCountByType[type] ?? 0) > 0,
          )
            .map(
              (type) =>
                `${PAYMENT_ANOMALY_LABEL[type]} ${summary?.issueCountByType[type]}`,
            )
            .join(" · ")}
        </Alert>
      )}

      {refundRequestedCount > 0 && tab === "ALL" && (
        <Alert
          tone="warning"
          title={`승인을 기다리는 환불이 ${formatWithCommas(refundRequestedCount)}건 있습니다.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setParams({ tab: "REFUND_REQUESTED" })}
            >
              환불 요청 보기
            </Button>
          }
        >
          승인하면 결제한 PG로 전액이 취소됩니다. 기한은 신청 시점으로 판정합니다.
        </Alert>
      )}

      {tab === "WITHDRAWN" && retentionExpiringCount > 0 && retention !== "EXPIRING" && (
        <Alert
          tone="info"
          title={`보존 기간이 ${EXPIRING_DAYS}일 안에 끝나는 결제가 ${formatWithCommas(retentionExpiringCount)}건 있습니다.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setParams({ retention: "EXPIRING" })}
            >
              만료 임박 보기
            </Button>
          }
        >
          만료일이 지나면 파기 배치가 결제 기록까지 지웁니다. 분쟁 · 소송 중이라 더 보존해야 하는
          건이 있는지 먼저 확인해 주세요.
        </Alert>
      )}

      {userId && (
        <Alert
          tone="warning"
          title="한 사람의 결제만 보고 있습니다."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setParams({ userId: "" })}
            >
              전체 보기
            </Button>
          }
        >
          유저 #{userId}의 결제만 조회하는
          중입니다.
        </Alert>
      )}

      <Card
        title={`${copy.title} ${formatWithCommas(totalCount)}건`}
        description="행을 클릭하면 이 결제에 일어난 일을 처음부터 끝까지 봅니다. 환불 승인 · 이상 확인도 상세에서 합니다."
        action={
          <CsvExportButton
            fileName="결제내역"
            rows={rows}
            columns={CSV_COLUMNS}
            disabled={isLoading || isError}
          />
        }
        noPadding
      >
        <Tabs
          items={tabs}
          value={tab}
          onChange={(next) => setParams({ tab: next, anomalyType: "" })}
          className="px-2"
        />

        {/* 확인 필요 탭은 유형으로 한 번 더 좁힌다. 유형마다 할 일이 달라 몰아서 처리한다. */}
        {tab === "ISSUE" && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border-main px-5 py-3">
            {[
              { value: "", label: "전체", count: issueCount },
              ...PAYMENT_ANOMALY_ORDER.map((type) => ({
                value: type,
                label: PAYMENT_ANOMALY_LABEL[type],
                count: summary?.issueCountByType[type] ?? 0,
              })),
            ].map((chip) => (
              <button
                key={chip.value || "ALL"}
                type="button"
                aria-pressed={anomalyType === chip.value}
                onClick={() => setParams({ anomalyType: chip.value })}
                className={cn(
                  "rounded-full border px-3 py-1 body-6 transition",
                  anomalyType === chip.value
                    ? "border-brand bg-brand-opacity text-brand"
                    : "border-border-main text-font-2 hover:border-brand hover:text-brand",
                  chip.value && chip.count === 0 && "opacity-50",
                )}
              >
                {chip.label}{" "}
                <span className="tabular-nums">{formatWithCommas(chip.count)}</span>
              </button>
            ))}
          </div>
        )}

        {/*
          필터가 많아 한 줄에 몰면 좁은 화면에서 서로를 밀어 글자가 쪼개진다.
          첫 줄은 검색 · 분류, 둘째 줄은 기간으로 나누고, 줄이 넘쳐도 들쭉날쭉하지 않게 모두 왼쪽부터 붙인다.
        */}
        <div className="flex flex-col gap-2.5 border-b border-border-main px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={keyword}
              onSearch={(next) => setParams({ keyword: next })}
              placeholder="주문번호, PG 거래번호, 닉네임, 유저 ID"
              boxClassName="w-80 max-w-full"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="결제 상태 필터"
                options={PAYMENT_STATUS_FILTER_OPTIONS}
                value={paymentStatus}
                onChange={(event) =>
                  setParams({ paymentStatus: event.target.value })
                }
                selectBoxClassName="w-36"
              />
              <Select
                aria-label="PG 필터"
                options={PAYMENT_PG_PROVIDER_FILTER_OPTIONS}
                value={pgProvider}
                onChange={(event) => setParams({ pgProvider: event.target.value })}
                selectBoxClassName="w-36"
              />
              <Select
                aria-label="보존 기간 필터"
                options={RETENTION_FILTER_OPTIONS.map((option) =>
                  option.value === "EXPIRING"
                    ? { ...option, label: `${option.label} (${formatWithCommas(retentionExpiringCount)})` }
                    : option,
                )}
                value={retention}
                onChange={(event) => setParams({ retention: event.target.value })}
                selectBoxClassName="w-44"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 body-5 text-font-2">주문일</span>
            {/* 주문일 기준. 승인되지 않은 주문(만료 · 판정 불가)도 같은 축으로 찾는다. */}
            <DateRangeFilter
              value={{ startDate, endDate }}
              onChange={(range) => setParams(range)}
            />
          </div>
        </div>

        {isError ? (
          <EmptyState
            icon={<Warning size={22} />}
            title="결제 내역을 불러오지 못했습니다."
            description={
              error?.message ??
              "네트워크 또는 서버 오류입니다. 잠시 후 다시 시도해 주세요."
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Refresh size={15} />}
                isLoading={isFetching}
                onClick={() => refetch()}
              >
                다시 시도
              </Button>
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.paymentOrderId}
              isLoading={isLoading}
              getRowHref={(row) => `/billing/payments/${row.paymentOrderId}`}
              emptyTitle={copy.empty}
              emptyDescription="검색어나 필터를 바꿔 보세요."
            />

            {totalCount > 0 && (
              <Pagination
                page={page}
                totalCount={totalCount}
                pageSize={DEFAULT_PAGE_SIZE}
                onChange={(next) => setParams({ page: next })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
};

export default PaymentOrderManager;
