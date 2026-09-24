"use client";

import Link from "next/link";
import { useState } from "react";
import {
  usePendingRedemptionCountQuery,
  useRedemptionListQuery,
} from "@/api/earning/getRedemptionList";
import { useRedemptionMutation } from "@/api/earning/mutateEarning";
import { useListParams } from "@/hooks/useListParams";
import { ChevronDown } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Redemption, RewardRedemptionStatus } from "@/type/earning";
import RedemptionTimeline from "@/components/earning/RedemptionTimeline";
import { REDEMPTION_STATUS, formatPoint, maskPhone } from "@/components/earning/earningFormat";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import Textarea from "@/components/ui/Textarea";

const REJECT_PRESETS = [
  { label: "수신 번호 오류", value: "수신 번호가 올바르지 않아요. 번호를 확인한 뒤 다시 신청해 주세요." },
  { label: "부정 사용 의심", value: "계정 확인이 필요해 교환을 보류했어요. 고객센터로 문의해 주세요." },
  { label: "직접 입력", value: "" },
];

type Pending = { mode: "ISSUE" | "REJECT"; row: Redemption } | null;

/** 주소에 실리는 목록 조건. 처음 열면 발송 대기부터 본다. */
const DEFAULT_PARAMS = { page: 1, keyword: "", status: "REQUESTED" };

const RedemptionManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const status = params.status as RewardRedemptionStatus | "";

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [preset, setPreset] = useState(REJECT_PRESETS[0].value);

  const canSend = useHasPermission("earning:send");
  const { data, isLoading } = useRedemptionListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword: keyword || undefined,
    status,
  });
  const { data: pendingCount } = usePendingRedemptionCountQuery();
  const { issueMutation, rejectMutation } = useRedemptionMutation();

  const tabs: TabItem<RewardRedemptionStatus | "">[] = [
    { label: "발송 대기", value: "REQUESTED", count: pendingCount },
    { label: "노트 지급 중", value: "GRANTING" },
    { label: "완료", value: "ISSUED" },
    { label: "반려", value: "REJECTED" },
    { label: "전체", value: "" },
  ];

  const open = (mode: "ISSUE" | "REJECT", row: Redemption) => {
    setMemo("");
    setPreset(REJECT_PRESETS[0].value);
    setPending({ mode, row });
  };

  const columns: TableColumn<Redemption>[] = [
    {
      key: "requestedAt",
      header: "신청",
      width: "150px",
      numeric: true,
      render: (row) => <span className="text-font-2">{formatDateTime(row.requestedAt)}</span>,
    },
    {
      key: "creator",
      header: "제작자",
      render: (row) => (
        <TableCellStack
          primary={
            <Link
              href={`/earnings/creators/${row.accountId}`}
              className="hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.nickname ?? "-"}
              {row.accountStatus === "FROZEN" && (
                <Badge tone="danger" className="ml-1.5">
                  동결
                </Badge>
              )}
            </Link>
          }
          secondary={<span className="font-mono">{row.userId}</span>}
        />
      ),
    },
    {
      key: "product",
      header: "상품",
      render: (row) => (
        <TableCellStack
          primary={row.productName}
          secondary={row.type === "NOTE" ? `노트 ${formatWithCommas(row.noteAmount ?? 0)}개 전환` : undefined}
        />
      ),
    },
    {
      key: "point",
      header: "포인트",
      align: "right",
      numeric: true,
      render: (row) => formatPoint(row.pointAmount),
    },
    {
      key: "phone",
      header: "받는 번호",
      width: "170px",
      render: (row) =>
        !row.recipientPhone ? (
          <span className="text-font-disabled">-</span>
        ) : (
          <span className="flex items-center gap-2 font-mono">
            {revealed.includes(row.redemptionId) ? row.recipientPhone : maskPhone(row.recipientPhone)}
            {!revealed.includes(row.redemptionId) && row.status === "REQUESTED" && (
              <button
                type="button"
                className="body-6 text-info hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  setRevealed((prev) => [...prev, row.redemptionId]);
                }}
              >
                보기
              </button>
            )}
          </span>
        ),
    },
    {
      key: "status",
      header: "상태",
      width: "220px",
      render: (row) => {
        if (row.status === "REQUESTED" && canSend) {
          return (
            <div className="flex gap-1.5" onClick={(event) => event.stopPropagation()}>
              <Button
                size="sm"
                disabled={row.accountStatus === "FROZEN"}
                onClick={() => open("ISSUE", row)}
              >
                발송
              </Button>
              <Button size="sm" variant="dangerGhost" onClick={() => open("REJECT", row)}>
                반려
              </Button>
            </div>
          );
        }
        return (
          <TableCellStack
            primary={
              <Badge tone={REDEMPTION_STATUS[row.status].tone}>{REDEMPTION_STATUS[row.status].label}</Badge>
            }
            secondary={
              row.processedAt ? (
                <span title={row.rejectReason ?? row.memo}>
                  {row.processedByName ?? "시스템"} · {formatDateTime(row.processedAt)}
                </span>
              ) : undefined
            }
          />
        );
      },
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

  const rejectReason = (preset || memo).trim();
  const isSubmitting = issueMutation.isPending || rejectMutation.isPending;

  const handleConfirm = () => {
    if (!pending) return;
    const done = { onSuccess: () => setPending(null) };
    if (pending.mode === "ISSUE") {
      issueMutation.mutate({ redemptionId: pending.row.redemptionId, memo: memo.trim() }, done);
    } else {
      rejectMutation.mutate({ redemptionId: pending.row.redemptionId, reason: rejectReason }, done);
    }
  };

  return (
    <>
      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <Tabs items={tabs} value={status} onChange={(next) => setParams({ status: next })} />
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="닉네임 · 유저 ID · 상품명"
            boxClassName="w-64"
          />
        </div>
        <Table
          columns={columns}
          rows={data?.content ?? []}
          isLoading={isLoading}
          getRowKey={(row) => row.redemptionId}
          expandedKeys={expandedKeys}
          onToggleExpand={(key) =>
            setExpandedKeys((prev) =>
              prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
            )
          }
          renderExpanded={(row) => <RedemptionTimeline row={row} />}
          emptyTitle={status === "REQUESTED" ? "처리할 교환 신청이 없습니다." : "교환 신청이 없습니다."}
        />
        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      {pending && (
        <Modal
          isOpen
          onClose={() => setPending(null)}
          size="sm"
          title={pending.mode === "ISSUE" ? "발송" : "교환 반려"}
          description={
            pending.mode === "ISSUE"
              ? `${pending.row.nickname ?? pending.row.userId} · ${pending.row.productName}. 상품권을 보낸 뒤 처리하세요. 포인트(${formatPoint(pending.row.pointAmount)})는 신청 때 이미 차감됐습니다.`
              : `${pending.row.nickname ?? pending.row.userId} · ${pending.row.productName}. 차감한 ${formatPoint(pending.row.pointAmount)}를 제작자에게 돌려줍니다. 사유는 제작자 내역에 그대로 보입니다.`
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setPending(null)}>
                취소
              </Button>
              <Button
                variant={pending.mode === "ISSUE" ? "primary" : "danger"}
                disabled={isSubmitting || (pending.mode === "REJECT" && rejectReason.length === 0)}
                onClick={handleConfirm}
              >
                {pending.mode === "ISSUE" ? "발송" : "반려"}
              </Button>
            </>
          }
        >
          {pending.mode === "ISSUE" ? (
            <FormField label="메모" hint="발송 채널, 기프티콘 주문 번호 등. 조치 이력에 남습니다.">
              <Textarea rows={3} maxLength={500} value={memo} onChange={(event) => setMemo(event.target.value)} />
            </FormField>
          ) : (
            <div className="flex flex-col gap-4">
              <FormField label="반려 사유" required>
                <Select
                  options={REJECT_PRESETS}
                  value={preset}
                  onChange={(event) => setPreset(event.target.value)}
                />
              </FormField>
              {preset === "" && (
                <FormField label="직접 입력" required>
                  <Textarea
                    rows={3}
                    maxLength={200}
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                  />
                </FormField>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default RedemptionManager;
