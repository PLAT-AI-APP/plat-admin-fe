"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { useCan } from "@/hooks/useCan";
import {
  useChangeUserCreatorTierMutation,
  useUserCreatorTierQuery,
} from "@/api/earning/creatorTier";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import TierChangeModal from "@/components/creatorTier/TierChangeModal";
import TierLabel from "@/components/creatorTier/TierLabel";
import type {
  CreatorTierChange,
  CreatorTierChangeKind,
} from "@/type/creatorTier";

const KIND_BADGE: Record<
  CreatorTierChangeKind,
  { label: string; tone: "neutral" | "brand" | "info" }
> = {
  SELF: { label: "직접 승급", tone: "neutral" },
  ADMIN: { label: "관리자 변경", tone: "info" },
  ORIGIN: { label: "오리진 지정", tone: "brand" },
};

const LOG_COLUMNS: TableColumn<CreatorTierChange>[] = [
  {
    key: "at",
    header: "일시",
    width: "150px",
    numeric: true,
    render: (row) => (
      <span className="text-font-2">{formatDateTime(row.effectiveAt)}</span>
    ),
  },
  {
    key: "change",
    header: "등급",
    render: (row) => <TierLabel tier={row.to} />,
  },
  {
    key: "kind",
    header: "구분",
    width: "110px",
    render: (row) => (
      <Badge tone={KIND_BADGE[row.kind].tone}>
        {KIND_BADGE[row.kind].label}
      </Badge>
    ),
  },
  {
    key: "memo",
    header: "사유 · 처리자",
    render: (row) =>
      row.kind === "SELF" ? (
        <span className="text-font-2">-</span>
      ) : (
        <TableCellStack primary={row.memo ?? "-"} secondary={row.adminName} />
      ),
  },
];

/** 유저 상세 > 크리에이터. 현재 등급과 활동 지표, 등급 이력, 예외 조정. */
const UserCreatorPanel = ({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}) => {
  const { data, isLoading } = useUserCreatorTierQuery(userId);
  const mutation = useChangeUserCreatorTierMutation();
  const canWrite = useCan("earning:write");
  const [isChangeOpen, setChangeOpen] = useState(false);

  if (isLoading || !data)
    return <Skeleton className="h-48 w-full rounded-card" />;

  const metrics = [
    { label: "공개 캐릭터", value: data.publicUniverses, unit: "개" },
    { label: "누적 유료 대화", value: data.paidTurns, unit: "회" },
    { label: "팔로워", value: data.followers, unit: "명" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="크리에이터 등급"
        action={
          canWrite && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setChangeOpen(true)}
            >
              등급 변경
            </Button>
          )
        }
      >
        <div className="flex items-center gap-6">
          <div className="flex shrink-0 items-center gap-2">
            <TierLabel tier={data.currentTier} size={40} />
            {data.locked && <Badge tone="warning">고정</Badge>}
          </div>
          <span className="h-10 w-px shrink-0 bg-border-main" aria-hidden />
          <dl className="grid flex-1 grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col gap-1">
                <dt className="body-5 text-font-2">{metric.label}</dt>
                <dd className="title-2 font-mono">
                  {formatWithCommas(metric.value)}
                  <span className="ml-0.5 body-4 text-font-2">
                    {metric.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <Card title="등급 이력" noPadding>
        <Table
          minRows={0}
          columns={LOG_COLUMNS}
          rows={data.changes}
          getRowKey={(row) => row.id}
          emptyTitle="등급 변경 이력이 없습니다."
        />
      </Card>

      {isChangeOpen && (
        <TierChangeModal
          nickname={nickname}
          current={data.currentTier}
          locked={data.locked}
          isSubmitting={mutation.isPending}
          onClose={() => setChangeOpen(false)}
          onSubmit={(input) =>
            mutation
              .mutateAsync({ userId, input })
              .then(() => setChangeOpen(false))
          }
        />
      )}
    </div>
  );
};

export default UserCreatorPanel;
