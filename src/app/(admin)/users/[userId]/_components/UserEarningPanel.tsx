"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EARNING_ACCOUNT_NOT_FOUND,
  useAccountRedemptionsQuery,
  useEarningAccountByUserQuery,
  useEarningLedgersQuery,
} from "@/api/earning/getEarningAccountDetail";
import { ChevronDown } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { EARNING_LEDGER_LABEL } from "@/type/earning";
import RedemptionTimeline from "@/components/earning/RedemptionTimeline";
import SummaryTiles from "@/components/earning/SummaryTiles";
import { REDEMPTION_STATUS, formatPoint, ledgerTone } from "@/components/earning/earningFormat";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Table from "@/components/ui/Table";

const RECENT_LIMIT = 5;

/**
 * 이 유저의 제작자 수익 요약. 조치(동결·차감)는 제작자 수익 상세에서 한다.
 * 대화 수익이 한 번도 없던 유저는 수익 계정이 없다.
 */
const UserEarningPanel = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const { data: account, isLoading, error } = useEarningAccountByUserQuery(userId);
  const accountId = account?.accountId ?? "";
  const ledgerQuery = useEarningLedgersQuery(accountId, RECENT_LIMIT, Boolean(account));
  const { data: redemptions = [] } = useAccountRedemptionsQuery(accountId, Boolean(account));

  if (isLoading) return <Skeleton className="h-48 w-full rounded-card" />;

  if (!account) {
    return (
      <EmptyState
        title={error?.code === EARNING_ACCOUNT_NOT_FOUND ? "수익 계정이 없습니다." : "수익 정보를 불러오지 못했습니다."}
        description={
          error?.code === EARNING_ACCOUNT_NOT_FOUND
            ? "이 유저의 세계관에서 유료 대화 적립이 아직 없습니다."
            : undefined
        }
      />
    );
  }

  const ledgers = ledgerQuery.data?.pages[0]?.content ?? [];
  const recentRedemptions = redemptions.slice(0, RECENT_LIMIT);

  return (
    <div className="flex flex-col gap-5">
      <Card
        title={
          <span className="flex items-center gap-2">
            수익 포인트
            {account.status === "FROZEN" && <Badge tone="danger">동결</Badge>}
          </span>
        }
        action={
          <Button size="sm" variant="secondary" onClick={() => router.push(`/earnings/creators/${account.accountId}`)}>
            수익 상세 · 조치
          </Button>
        }
      >
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
      </Card>

      <Card title="최근 포인트 원장" noPadding>
        <Table
          minRows={0}
          isLoading={ledgerQuery.isLoading}
          columns={[
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
              width: "110px",
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
          ]}
          rows={ledgers}
          getRowKey={(row) => row.ledgerId}
          emptyTitle="원장 기록이 없습니다."
        />
      </Card>

      <Card title="최근 교환 신청" description="행을 펼치면 처리 내역이 보입니다." noPadding>
        <Table
          minRows={0}
          columns={[
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
          ]}
          rows={recentRedemptions}
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
  );
};

export default UserEarningPanel;
