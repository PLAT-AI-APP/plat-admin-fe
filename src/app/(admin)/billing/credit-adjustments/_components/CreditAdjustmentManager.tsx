"use client";

import { useState } from "react";
import { useCreditAdjustmentListQuery } from "@/api/billing/getCreditAdjustmentList";
import { useCreditAdjustmentMutation } from "@/api/billing/mutateCreditAdjustment";
import { Coin, Plus } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatAdmin, formatCredit, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  AdjustmentType,
  CreditAdjustment,
  CreditAdjustmentFormValues,
} from "@/type/billing";
import type { AdjustableUser } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";
import CreditAdjustmentFormModal from "./CreditAdjustmentFormModal";
import {
  ADJUSTMENT_TYPE_FILTER_OPTIONS,
  ADJUSTMENT_TYPE_LABEL,
  ADJUSTMENT_TYPE_SIGN,
  ADJUSTMENT_TYPE_TONE,
} from "./adjustmentOptions";

/** 지급은 +, 차감은 - 부호를 붙여 표기한다. */
const formatSignedCredit = (type: AdjustmentType, amount: number) =>
  `${ADJUSTMENT_TYPE_SIGN[type]}${formatCredit(amount)}`;

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const ADJUSTMENT_CSV_COLUMNS: CsvColumn<CreditAdjustment>[] = [
  { header: "유저", value: (row) => row.userNickname },
  { header: "유저 ID", value: (row) => row.userId },
  { header: "유형", value: (row) => ADJUSTMENT_TYPE_LABEL[row.type] },
  {
    header: "조정 크레딧",
    value: (row) => `${ADJUSTMENT_TYPE_SIGN[row.type]}${row.amount}`,
  },
  { header: "사유", value: (row) => row.reason },
  { header: "조정 후 잔액", value: (row) => row.balanceAfter },
  {
    header: "처리자",
    value: (row) => formatAdmin(row.processedBy, row.processedById),
  },
  { header: "일시", value: (row) => formatDateTime(row.createdAt) },
];

const CreditAdjustmentManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<AdjustmentType | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading } = useCreditAdjustmentListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    type,
  });
  const { createMutation } = useCreditAdjustmentMutation();

  const adjustments = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleChangeType = (nextType: AdjustmentType | "") => {
    setType(nextType);
    setPage(1);
  };

  /**
   * 조정은 실행 즉시 잔액이 바뀌고 되돌릴 수 없으므로,
   * 대상 닉네임과 금액을 다시 보여 주는 확인 단계를 반드시 거친다.
   */
  const handleSubmit = (
    values: CreditAdjustmentFormValues,
    user: AdjustableUser,
  ) => {
    const typeLabel = ADJUSTMENT_TYPE_LABEL[values.type];

    openConfirm({
      title: `크레딧을 ${typeLabel}할까요?`,
      description: `'${user.nickname}'(#${user.userId}) 님에게 ${formatCredit(values.amount)}를 ${typeLabel}합니다.`,
      warning:
        "실행 즉시 유저 잔액에 반영되며 되돌릴 수 없습니다. 사유는 감사 로그로 남습니다.",
      confirmText: `${typeLabel} 실행`,
      tone: "danger",
      onConfirm: async () => {
        await createMutation.mutateAsync(values);

        setIsFormOpen(false);
      },
    });
  };

  const columns: TableColumn<CreditAdjustment>[] = [
    {
      key: "user",
      header: "유저",
      width: "180px",
      render: (adjustment) => (
        <TableCellStack
          primary={adjustment.userNickname}
          secondary={`#${adjustment.userId}`}
        />
      ),
    },
    {
      key: "type",
      header: "유형",
      width: "90px",
      render: (adjustment) => (
        <Badge tone={ADJUSTMENT_TYPE_TONE[adjustment.type]}>
          {ADJUSTMENT_TYPE_LABEL[adjustment.type]}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "조정 크레딧",
      width: "140px",
      align: "right",
      numeric: true,
      render: (adjustment) => (
        <span
          className={cn(
            "font-semibold",
            adjustment.type === "GRANT" ? "text-success" : "text-danger",
          )}
        >
          {formatSignedCredit(adjustment.type, adjustment.amount)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "사유",
      render: (adjustment) => (
        <p className="max-w-100 text-font-2">{adjustment.reason}</p>
      ),
    },
    {
      key: "balanceAfter",
      header: "조정 후 잔액",
      width: "140px",
      align: "right",
      numeric: true,
      render: (adjustment) => formatCredit(adjustment.balanceAfter),
    },
    {
      key: "processedBy",
      header: "처리자",
      width: "110px",
      render: (adjustment) => (
        <Badge tone="neutral">
          {formatAdmin(adjustment.processedBy, adjustment.processedById)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "일시",
      width: "150px",
      numeric: true,
      render: (adjustment) => (
        <span className="text-font-2">{formatDateTime(adjustment.createdAt)}</span>
      ),
    },
  ];

  return (
    <>
      <Alert tone="warning" title="수동 조정은 되돌릴 수 없습니다.">
        지급·차감 결과는 즉시 유저 잔액에 반영되고 결제 장부에도 그대로
        기록됩니다. 반드시 확인 가능한 사유(CS 티켓 번호 등)를 남겨 주세요.
      </Alert>

      <Card
        title={`조정 이력 ${formatWithCommas(totalCount)}건`}
        description="운영자가 직접 지급·차감한 내역입니다."
        action={
          <>
            <CsvExportButton
              fileName="크레딧수동조정"
              rows={adjustments}
              columns={ADJUSTMENT_CSV_COLUMNS}
              disabled={isLoading}
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              크레딧 조정
            </Button>
          </>
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="닉네임, 유저 ID, 사유 검색"
          />

          <Select
            aria-label="조정 유형 필터"
            options={ADJUSTMENT_TYPE_FILTER_OPTIONS}
            value={type}
            onChange={(event) =>
              handleChangeType(event.target.value as AdjustmentType | "")
            }
            selectBoxClassName="w-36"
          />
        </div>

        <Table
          columns={columns}
          rows={adjustments}
          getRowKey={(adjustment) => String(adjustment.adjustmentId)}
          isLoading={isLoading}
          skeletonRows={6}
          emptyTitle="조정 이력이 없습니다."
          emptyDescription="보상·회수가 필요하면 '크레딧 조정'으로 대상 유저를 선택해 처리하세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Coin size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              크레딧 조정
            </Button>
          }
        />

        {totalCount > 0 && (
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </Card>

      <CreditAdjustmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
};

export default CreditAdjustmentManager;
