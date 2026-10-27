"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { useCan } from "@/hooks/useCan";
import {
  useChangeTierDefinitionMutation,
  useCreatorTierBoardQuery,
  useTierDefinitionChangesQuery,
} from "@/api/earning/creatorTier";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import TierLabel from "@/components/creatorTier/TierLabel";
import { TIER_NAME } from "@/components/creatorTier/tierMeta";
import type { TierDefinition, TierDefinitionChange } from "@/type/creatorTier";
import TierConditionModal from "./TierConditionModal";

/** 표의 한 줄. 오리진은 사다리 밖의 계약 등급이라 갤럭시 아래에 보기만 한다. */
type BoardRow =
  | (TierDefinition & { origin?: false })
  | { origin: true; code: "ORIGIN"; memberCount: number; shareBps: number };

const LOG_COLUMNS: TableColumn<TierDefinitionChange>[] = [
  {
    key: "at",
    header: "적용 시각",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.createdAt)}</span>
    ),
  },
  {
    key: "summary",
    header: "변경 내용",
    render: (row) => `${TIER_NAME[row.code]} ${row.summary}`,
  },
  {
    key: "memo",
    header: "사유 · 처리자",
    render: (row) => (
      <TableCellStack primary={row.memo} secondary={row.adminName} />
    ),
  },
];

const percent = (bps: number) => `${bps / 100}%`;

const TierDefinitionManager = () => {
  const { data: board, isLoading } = useCreatorTierBoardQuery();
  const { data: changes = [], isLoading: isChangesLoading } =
    useTierDefinitionChangesQuery();
  const mutation = useChangeTierDefinitionMutation();
  const canWrite = useCan("earning:write");
  const [editing, setEditing] = useState<TierDefinition | null>(null);
  const [benefitsOf, setBenefitsOf] = useState<TierDefinition | null>(null);

  if (isLoading || !board)
    return <Skeleton className="h-64 w-full rounded-card" />;

  const rows: BoardRow[] = [
    ...board.tiers,
    {
      origin: true,
      code: "ORIGIN",
      memberCount: board.originMemberCount,
      shareBps: board.originShareBps,
    },
  ];
  const dash = <span className="text-font-2">-</span>;

  const columns: TableColumn<BoardRow>[] = [
    {
      key: "tier",
      header: "등급",
      width: "200px",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <TierLabel tier={row.code} size={24} />
          {row.origin && <span className="text-font-2">공식 크리에이터</span>}
        </span>
      ),
    },
    {
      key: "condition",
      header: "승급 조건 (캐릭터 · 유료 대화 · 팔로워)",
      numeric: true,
      render: (row) =>
        row.origin ? (
          <span className="text-font-2">운영자 지정</span>
        ) : (
          `${formatWithCommas(row.minPublicUniverses)}개 · ${formatWithCommas(row.minPaidTurns)}회 · ${formatWithCommas(row.minFollowers)}명`
        ),
    },
    {
      key: "rate",
      header: "수익률",
      align: "right",
      numeric: true,
      render: (row) => percent(row.shareBps),
    },
    {
      key: "boost",
      header: "신작 부스트",
      align: "right",
      numeric: true,
      render: (row) => (row.origin ? dash : `+${percent(row.boostBps)}`),
    },
    {
      key: "hold",
      header: "보류",
      align: "right",
      numeric: true,
      render: (row) =>
        `${row.origin ? board.tiers[board.tiers.length - 1].holdDays : row.holdDays}일`,
    },
    {
      key: "gift",
      header: "축하 노트",
      align: "right",
      numeric: true,
      render: (row) =>
        row.origin || !row.giftNotes ? dash : formatWithCommas(row.giftNotes),
    },
    {
      key: "benefits",
      header: "그 밖의 혜택",
      align: "right",
      numeric: true,
      render: (row) =>
        row.origin || row.benefits.length === 0 ? (
          dash
        ) : (
          <button
            type="button"
            className="text-brand underline-offset-2 hover:underline"
            onClick={() => setBenefitsOf(row)}
          >
            {row.benefits.length}개
          </button>
        ),
    },
    {
      key: "members",
      header: "보유",
      align: "right",
      numeric: true,
      render: (row) => `${formatWithCommas(row.memberCount)}명`,
    },
    {
      key: "edit",
      header: "",
      width: "72px",
      align: "right",
      render: (row) =>
        row.origin || !canWrite ? null : (
          <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
            수정
          </Button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="등급"
        description={`등급이 없는 크리에이터의 수익률은 ${percent(board.baseShareBps)}입니다. 등급은 고정이고 승급 조건과 그 밖의 혜택만 바꿀 수 있습니다.`}
        noPadding
      >
        <Table
          minRows={0}
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.code}
        />
      </Card>

      <Card title="기준 변경 이력" noPadding>
        <Table
          minRows={0}
          columns={LOG_COLUMNS}
          rows={changes}
          isLoading={isChangesLoading}
          getRowKey={(row) => row.id}
          emptyTitle="변경 이력이 없습니다."
        />
      </Card>

      {editing && (
        <TierConditionModal
          tier={editing}
          isSubmitting={mutation.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            mutation
              .mutateAsync({ code: editing.code, values })
              .then(() => setEditing(null))
          }
        />
      )}

      {benefitsOf && (
        <Modal
          isOpen
          size="sm"
          onClose={() => setBenefitsOf(null)}
          title={`${TIER_NAME[benefitsOf.code]} · 그 밖의 혜택`}
        >
          <ul className="flex flex-col">
            {benefitsOf.benefits.map((benefit) => (
              <li
                key={benefit.label}
                className="body-5 flex justify-between border-b border-border-main py-2.5 last:border-b-0"
              >
                <span className="text-font-2">{benefit.label}</span>
                <span>{benefit.value}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
};

export default TierDefinitionManager;
