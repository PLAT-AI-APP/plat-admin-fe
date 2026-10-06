"use client";

import Link from "next/link";
import { useState } from "react";
import { usePendingCountsQuery } from "@/api/ops/getPendingCounts";
import { useUniverseHandoverListQuery } from "@/api/universe/getUniverseHandoverList";
import {
  isHandoverGoneError,
  useUniverseHandoverMutation,
} from "@/api/universe/mutateUniverseHandover";
import { useListParams } from "@/hooks/useListParams";
import { Refresh, Warning } from "@/icons";
import dayjs, { daysLeftKst, formatDate, formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  HANDOVER_AGE_BASIS_LABEL,
  UNIVERSE_HANDOVER_REASON_LABEL,
  UNIVERSE_HANDOVER_STATUS_LABEL,
  type UniverseHandover,
  type UniverseHandoverStatus,
} from "@/type/universeHandover";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import {
  HANDOVER_DEADLINE_WARN_DAYS,
  HANDOVER_STATUS_ALL,
  HANDOVER_STATUS_TONE,
} from "../_constants/handoverOptions";
import HandoverApproveModal from "./HandoverApproveModal";
import HandoverRejectModal from "./HandoverRejectModal";

type StatusTab = UniverseHandoverStatus | typeof HANDOVER_STATUS_ALL;

type Pending = { mode: "APPROVE" | "REJECT"; row: UniverseHandover } | null;

/** 주소에 실리는 목록 조건. 처음 열면 심사 대기부터 본다. */
const DEFAULT_PARAMS = { page: 1, status: "PENDING" };

/** 남은 기한. 지났으면 붉게, 사흘 안이면 경고색으로 칠한다. */
const DeadlineCell = ({ deadlineAt }: { deadlineAt: string }) => {
  const isOver = dayjs(deadlineAt).isBefore(dayjs());
  const daysLeft = daysLeftKst(deadlineAt);

  return (
    <TableCellStack
      primary={
        <span
          className={cn(
            "font-semibold tabular-nums",
            isOver
              ? "text-danger"
              : daysLeft <= HANDOVER_DEADLINE_WARN_DAYS && "text-warning",
          )}
        >
          {isOver ? "기한 지남" : daysLeft === 0 ? "D-day" : `D-${daysLeft}`}
        </span>
      }
      secondary={formatDateTime(deadlineAt)}
    />
  );
};

/**
 * 탈퇴 캐릭터 인수 심사 목록.
 *
 * 한 줄이 탈퇴한 제작자가 남긴 세계관 하나다. 원 제작자는 탈퇴해 닉네임이 없어 인수 번호와
 * 세계관으로만 가린다. 설정 · 이미지는 세계관 상세에서 확인한다.
 */
const UniverseHandoverManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page } = params;
  const statusTab = params.status as StatusTab;
  const [pending, setPending] = useState<Pending>(null);

  const canWrite = useHasPermission("universeHandover:write");
  const { data, isLoading, isError, error, refetch, isFetching } =
    useUniverseHandoverListQuery({
      page,
      size: DEFAULT_PAGE_SIZE,
      status: statusTab === HANDOVER_STATUS_ALL ? "" : statusTab,
    });
  const { data: pendingCounts } = usePendingCountsQuery();
  const { approveMutation, rejectMutation } = useUniverseHandoverMutation();

  const tabs: TabItem<StatusTab>[] = [
    { label: "심사 대기", value: "PENDING", count: pendingCounts.handover },
    { label: "인수", value: "APPROVED" },
    { label: "반려", value: "REJECTED" },
    { label: "기한 만료", value: "EXPIRED" },
    { label: "전체", value: HANDOVER_STATUS_ALL },
  ];

  const close = () => setPending(null);

  /* 이미 처리됐거나 사라진 건은 모달을 닫는다. 받을 계정 무효는 열어 두고 다시 고르게 한다. */
  const done = {
    onSuccess: close,
    onError: (mutationError: Parameters<typeof isHandoverGoneError>[0]) => {
      if (isHandoverGoneError(mutationError)) close();
    },
  };

  const columns: TableColumn<UniverseHandover>[] = [
    {
      key: "handoverId",
      header: "인수 번호",
      width: "170px",
      numeric: true,
      render: (row) => <span className="text-font-2">#{row.handoverId}</span>,
    },
    {
      key: "universe",
      header: "캐릭터",
      render: (row) => (
        <TableCellStack
          primary={
            <Link
              href={`/universes/${row.universeId}`}
              className="font-medium hover:text-brand hover:underline"
            >
              {row.universeTitle ?? "(제목 없음)"}
            </Link>
          }
          secondary={<span className="tabular-nums">#{row.universeId}</span>}
        />
      ),
    },
    {
      key: "consentedAt",
      header: "동의 일시",
      width: "170px",
      numeric: true,
      render: (row) => (
        <TableCellStack
          primary={formatDateTime(row.consentedAt)}
          secondary={
            <span className={cn(row.ageBasis === "SELF_ATTESTED" && "text-warning")}>
              v{row.consentVersion} · {HANDOVER_AGE_BASIS_LABEL[row.ageBasis]}
            </span>
          }
        />
      ),
    },
    {
      key: "deadlineAt",
      header: "기한",
      width: "150px",
      render: (row) =>
        row.status === "PENDING" ? (
          <DeadlineCell deadlineAt={row.deadlineAt} />
        ) : (
          <span className="text-font-disabled tabular-nums">
            {formatDate(row.deadlineAt)}
          </span>
        ),
    },
    {
      key: "otherRoomCount",
      header: "다른 유저 방",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.otherRoomCount),
    },
    {
      key: "report",
      header: "신고 누적 / 미처리",
      align: "right",
      numeric: true,
      render: (row) => (
        <span title={`케이스 ${row.reportCaseCount}건 · 탈퇴 시점 기준`}>
          {formatWithCommas(row.reportCount)} /{" "}
          <span
            className={cn(
              row.pendingReportCount > 0 ? "font-semibold text-danger" : "text-font-2",
            )}
          >
            {formatWithCommas(row.pendingReportCount)}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "100px",
      render: (row) => (
        <Badge tone={HANDOVER_STATUS_TONE[row.status]}>
          {UNIVERSE_HANDOVER_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "handling",
      header: "처리",
      width: "240px",
      render: (row) => {
        if (row.status === "PENDING") {
          return canWrite ? (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => setPending({ mode: "APPROVE", row })}>
                승인
              </Button>
              <Button
                size="sm"
                variant="dangerGhost"
                onClick={() => setPending({ mode: "REJECT", row })}
              >
                반려
              </Button>
            </div>
          ) : (
            <span className="text-font-disabled">-</span>
          );
        }

        return (
          <div className="min-w-0">
            <TableCellStack
              primary={
                row.status === "APPROVED" && row.targetUserId ? (
                  <Link
                    href={`/users/${row.targetUserId}`}
                    className="hover:text-brand hover:underline"
                  >
                    {row.targetNickname ?? `#${row.targetUserId}`} 인수
                  </Link>
                ) : row.reasonCode ? (
                  UNIVERSE_HANDOVER_REASON_LABEL[row.reasonCode]
                ) : (
                  "-"
                )
              }
              secondary={`${row.handlerName ?? "시스템"} · ${formatDateTime(row.handledAt)}`}
            />
            {row.handlerNote && (
              <p className="mt-0.5 max-w-60 truncate body-6 text-font-2" title={row.handlerNote}>
                메모: {row.handlerNote}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Alert tone="warning" title="회사가 직접 운영하면 권리침해 · 개인정보 책임을 직접 집니다.">
        실존 인물 · 원작 IP · 도용 이미지 · 개인정보 · 신고 이력이 있는 캐릭터는 반려하세요.
        캐릭터 이름을 누르면 설정 · 이미지를 볼 수 있습니다.
      </Alert>

      <Card
        title={`인수 심사 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="신고 · 방 수는 탈퇴 시점 기준입니다."
        noPadding
      >
        <Tabs
          items={tabs}
          value={statusTab}
          onChange={(next) => setParams({ status: next })}
          className="px-3"
        />

        {isError ? (
          <EmptyState
            icon={<Warning size={22} />}
            title="인수 심사 목록을 불러오지 못했습니다."
            description={error?.message ?? "잠시 후 다시 시도해 주세요."}
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
              rows={data?.content ?? []}
              isLoading={isLoading}
              getRowKey={(row) => row.handoverId}
              emptyTitle={
                statusTab === "PENDING"
                  ? "심사할 캐릭터가 없습니다."
                  : "인수 심사 기록이 없습니다."
              }
            />
            <Pagination
              page={page}
              totalCount={data?.totalCount ?? 0}
              pageSize={DEFAULT_PAGE_SIZE}
              onChange={(next) => setParams({ page: next })}
            />
          </>
        )}
      </Card>

      {pending?.mode === "APPROVE" && (
        <HandoverApproveModal
          handover={pending.row}
          onClose={close}
          isSubmitting={approveMutation.isPending}
          onSubmit={({ targetUserId, note }) =>
            approveMutation.mutate(
              { handoverId: pending.row.handoverId, targetUserId, note },
              done,
            )
          }
        />
      )}

      {pending?.mode === "REJECT" && (
        <HandoverRejectModal
          handover={pending.row}
          onClose={close}
          isSubmitting={rejectMutation.isPending}
          onSubmit={({ reason, note }) =>
            rejectMutation.mutate(
              { handoverId: pending.row.handoverId, reason, note },
              done,
            )
          }
        />
      )}
    </>
  );
};

export default UniverseHandoverManager;
