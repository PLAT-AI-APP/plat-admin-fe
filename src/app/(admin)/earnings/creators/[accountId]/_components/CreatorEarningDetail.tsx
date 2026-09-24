"use client";

import { useState } from "react";
import {
  useAccountRedemptionsQuery,
  useEarningAccountQuery,
  useEarningAccrualsQuery,
  useEarningContributionsQuery,
  useEarningHistoriesQuery,
  useEarningLedgersQuery,
} from "@/api/earning/getEarningAccountDetail";
import { useEarningAccountActionMutation } from "@/api/earning/mutateEarning";
import { ChevronDown } from "@/icons";
import dayjs, { formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import {
  EARNING_LEDGER_LABEL,
  EARNING_REASON_LABEL,
  type EarningAccrualRow,
  type EarningLedgerRow,
  type Redemption,
} from "@/type/earning";
import RedemptionTimeline from "@/components/earning/RedemptionTimeline";
import SummaryTiles from "@/components/earning/SummaryTiles";
import { REDEMPTION_STATUS, formatPoint, ledgerTone } from "@/components/earning/earningFormat";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import AccountActionModal, { type AccountAction, type AccountActionInput } from "./AccountActionModal";

const LEDGER_COLUMNS: TableColumn<EarningLedgerRow>[] = [
  {
    key: "createdAt",
    header: "시각",
    width: "150px",
    numeric: true,
    render: (row) => <span className="text-font-2">{formatDateTime(row.createdAt)}</span>,
  },
  {
    key: "type",
    header: "유형",
    width: "100px",
    render: (row) => <Badge tone={ledgerTone(row)}>{EARNING_LEDGER_LABEL[row.type]}</Badge>,
  },
  {
    key: "amount",
    header: "변동",
    align: "right",
    numeric: true,
    render: (row) => (
      <span className={cn("font-semibold", row.amount < 0 && "text-danger")}>
        {row.amount > 0 ? "+" : ""}
        {formatPoint(row.amount)}
      </span>
    ),
  },
  {
    key: "balanceAfter",
    header: "잔액",
    align: "right",
    numeric: true,
    render: (row) => formatPoint(row.balanceAfter),
  },
  {
    key: "reference",
    header: "근거",
    render: (row) => {
      if (row.referenceType === "REDEMPTION") {
        return (
          <TableCellStack
            primary={row.productName ?? "교환"}
            secondary={<span className="font-mono">{row.referenceId}</span>}
          />
        );
      }
      if (row.referenceType === "EARNING_LOT") {
        return <TableCellStack primary="일별 적립" secondary={<span className="font-mono">묶음 {row.referenceId}</span>} />;
      }
      if (row.reasonCode) {
        return (
          <TableCellStack
            primary={`${EARNING_REASON_LABEL[row.reasonCode] ?? row.reasonCode}${row.memo ? ` · ${row.memo}` : ""}`}
            secondary={row.actorName}
          />
        );
      }
      return (
        <TableCellStack
          primary={<span className="font-mono">{row.referenceId}</span>}
          secondary={row.referenceType}
        />
      );
    },
  },
];

const ACCRUAL_COLUMNS: TableColumn<EarningAccrualRow>[] = [
  {
    key: "accrualDate",
    header: "사용일",
    width: "110px",
    numeric: true,
    render: (row) => <span className="text-font-2">{row.accrualDate.replaceAll("-", ".")}</span>,
  },
  {
    key: "chatter",
    header: "대화한 사용자",
    render: (row) => (
      <TableCellStack
        primary={row.chatterNickname ?? "-"}
        secondary={<span className="font-mono">{row.chatterUserId}</span>}
      />
    ),
  },
  { key: "universe", header: "세계관", render: (row) => row.universeTitle ?? row.universeId },
  {
    key: "turns",
    header: "대화",
    align: "right",
    numeric: true,
    render: (row) => `${formatWithCommas(row.turnCount)}턴`,
  },
  {
    key: "formula",
    header: "유료 노트 × 기준가 × 비율",
    align: "right",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">
        {formatWithCommas(row.paidNotes)} × {row.noteUnitPrice}원 × {row.shareBps / 100}%
      </span>
    ),
  },
  {
    key: "amount",
    header: "적립",
    align: "right",
    numeric: true,
    render: (row) => <span className="font-semibold">{formatPoint(row.amount)}</span>,
  },
];

/** 이어 받는 목록 아래의 "더 보기" */
const MoreButton = ({
  hasNextPage,
  isFetching,
  onClick,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  onClick: () => void;
}) =>
  hasNextPage ? (
    <div className="flex justify-center border-t border-border-main py-3">
      <Button size="sm" variant="ghost" disabled={isFetching} onClick={onClick}>
        더 보기
      </Button>
    </div>
  ) : null;

const CreatorEarningDetail = ({ accountId }: { accountId: string }) => {
  const [action, setAction] = useState<AccountAction | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const canWrite = useHasPermission("earning:write");
  const canAdjust = useHasPermission("earning:adjust");

  const { data: account, isLoading, isError } = useEarningAccountQuery(accountId);
  const { data: contributions = [] } = useEarningContributionsQuery(accountId);
  const { data: histories = [] } = useEarningHistoriesQuery(accountId);
  const { data: redemptions = [] } = useAccountRedemptionsQuery(accountId);
  const ledgerQuery = useEarningLedgersQuery(accountId);
  const accrualQuery = useEarningAccrualsQuery(accountId);

  const actionMutation = useEarningAccountActionMutation();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-card" />;

  if (isError || !account) {
    return (
      <>
        <BackLink href="/earnings/creators" label="제작자 수익" />
        <EmptyState title="제작자를 찾을 수 없습니다." />
      </>
    );
  }

  const ledgers = ledgerQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const accruals = accrualQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const freeze = histories.find((item) => item.targetType === "ACCOUNT" && item.toStatus === "FROZEN");

  const closeModal = () => setAction(null);

  const handleSubmit = (input: AccountActionInput) => {
    if (!action) return;
    actionMutation.mutate(
      {
        accountId,
        action,
        reasonCode: input.reasonCode,
        memo: input.memo,
        amount: action === "DEDUCT" ? input.amount : undefined,
      },
      { onSuccess: closeModal },
    );
  };

  const redemptionColumns: TableColumn<Redemption>[] = [
    {
      key: "requestedAt",
      header: "신청",
      width: "150px",
      numeric: true,
      render: (row) => <span className="text-font-2">{formatDateTime(row.requestedAt)}</span>,
    },
    { key: "product", header: "상품", render: (row) => row.productName },
    {
      key: "point",
      header: "포인트",
      align: "right",
      numeric: true,
      render: (row) => formatPoint(row.pointAmount),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (row) => (
        <Badge tone={REDEMPTION_STATUS[row.status].tone}>{REDEMPTION_STATUS[row.status].label}</Badge>
      ),
    },
    {
      key: "toggle",
      header: "",
      width: "48px",
      align: "right",
      render: (row) => (
        <ChevronDown
          size={16}
          className={cn(
            "text-font-2 transition-transform",
            expandedKeys.includes(row.redemptionId) && "rotate-180",
          )}
        />
      ),
    },
  ];

  return (
    <>
      <BackLink href="/earnings/creators" label="제작자 수익" />
      <PageHeader
        title={account.nickname ?? account.userId}
        description={`유저 ID ${account.userId} · 수익 계정 ${account.accountId}`}
        action={
          <div className="flex gap-2">
            {canAdjust && (
              <Button variant="secondary" onClick={() => setAction("DEDUCT")}>
                포인트 차감
              </Button>
            )}
            {canWrite &&
              (account.status === "FROZEN" ? (
                <Button onClick={() => setAction("UNFREEZE")}>동결 해제</Button>
              ) : (
                <Button variant="danger" onClick={() => setAction("FREEZE")}>
                  계정 동결
                </Button>
              ))}
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        {account.status === "FROZEN" && (
          <Alert tone="danger" title="동결된 계정">
            {freeze
              ? `${EARNING_REASON_LABEL[freeze.reasonCode] ?? freeze.reasonCode} · ${freeze.memo ?? ""} (${freeze.actorName ?? "-"}, ${formatDateTime(freeze.createdAt)})`
              : "상품권 교환과 노트 전환이 멈춰 있습니다."}
          </Alert>
        )}

        <SummaryTiles
          tiles={[
            { label: "교환 가능", value: formatPoint(account.available) },
            { label: "최근 30일 적립", value: formatPoint(account.accrued30d) },
            {
              label: "누적 적립 / 교환",
              value: formatPoint(account.totalAccrued),
              hint: `교환 ${formatPoint(account.totalRedeemed)}`,
            },
          ]}
        />

        <Card title="대화한 사용자별 기여" description="최근 30일 · 유료 노트 기준" noPadding>
          <Table
            minRows={0}
            columns={[
              {
                key: "user",
                header: "사용자",
                render: (row) => (
                  <TableCellStack
                    primary={row.nickname ?? row.userId}
                    secondary={row.joinedAt ? `가입 ${dayjs(row.joinedAt).format("YYYY-MM-DD")}` : undefined}
                  />
                ),
              },
              {
                key: "notes",
                header: "유료 노트",
                align: "right",
                numeric: true,
                render: (row) => formatWithCommas(row.paidNotes),
              },
              {
                key: "amount",
                header: "적립",
                align: "right",
                numeric: true,
                render: (row) => formatPoint(row.amount),
              },
              {
                key: "share",
                header: "비중",
                align: "right",
                numeric: true,
                render: (row) =>
                  account.accrued30d > 0 ? `${Math.round((row.amount / account.accrued30d) * 100)}%` : "-",
              },
            ]}
            rows={contributions}
            getRowKey={(row) => row.userId}
            emptyTitle="최근 30일 적립이 없습니다."
          />
        </Card>

        <Card title="포인트 원장" description="교환 가능 잔액의 모든 변동. 추가만 되고 수정·삭제되지 않습니다." noPadding>
          <Table
            minRows={0}
            columns={LEDGER_COLUMNS}
            rows={ledgers}
            isLoading={ledgerQuery.isLoading}
            getRowKey={(row) => row.ledgerId}
            emptyTitle="원장 기록이 없습니다."
          />
          <MoreButton
            hasNextPage={ledgerQuery.hasNextPage}
            isFetching={ledgerQuery.isFetchingNextPage}
            onClick={() => ledgerQuery.fetchNextPage()}
          />
        </Card>

        <Card title="적립 내역" description="하루 단위 적립. 사용일 다음 날 0시 10분에 바로 교환 가능 포인트로 들어갑니다." noPadding>
          <Table
            minRows={0}
            columns={ACCRUAL_COLUMNS}
            rows={accruals}
            isLoading={accrualQuery.isLoading}
            getRowKey={(row) => row.accrualId}
            emptyTitle="적립 내역이 없습니다."
          />
          <MoreButton
            hasNextPage={accrualQuery.hasNextPage}
            isFetching={accrualQuery.isFetchingNextPage}
            onClick={() => accrualQuery.fetchNextPage()}
          />
        </Card>

        <Card title="교환 신청" description="행을 펼치면 처리 내역이 보입니다." noPadding>
          <Table
            minRows={0}
            columns={redemptionColumns}
            rows={redemptions}
            getRowKey={(row) => row.redemptionId}
            expandedKeys={expandedKeys}
            onToggleExpand={(key) =>
              setExpandedKeys((prev) =>
                prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
              )
            }
            renderExpanded={(row) => <RedemptionTimeline row={row} />}
            emptyTitle="교환 신청이 없습니다."
          />
        </Card>
      </div>

      <AccountActionModal
        key={action ?? "closed"}
        action={action}
        available={account.available}
        isSubmitting={actionMutation.isPending}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default CreatorEarningDetail;
