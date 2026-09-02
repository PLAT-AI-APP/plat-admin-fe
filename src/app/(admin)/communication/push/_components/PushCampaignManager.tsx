"use client";

import { useState } from "react";
import { usePushCampaignListQuery } from "@/api/communication/getPushCampaignList";
import {
  usePushCampaignMutation,
  type PushCampaignFormValues,
} from "@/api/communication/mutatePushCampaign";
import { Megaphone, Plus, Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatAdmin, formatWithCommas, truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { PushCampaign, PushStatus } from "@/type/communication";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  PUSH_STATUS_LABEL,
  PUSH_STATUS_OPTIONS,
  PUSH_STATUS_TONE,
  PUSH_TARGET_LABEL,
} from "../../_constants/labels";
import PushCampaignFormModal from "./PushCampaignFormModal";

const PushCampaignManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<PushStatus | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading } = usePushCampaignListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    status,
  });
  const { createMutation, sendMutation, deleteMutation } =
    usePushCampaignMutation();

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 항상 1페이지로 되돌린다. */
  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  const handleChangeStatus = (next: PushStatus | "") => {
    setStatus(next);
    setPage(1);
  };

  const handleSubmit = (values: PushCampaignFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => setIsFormOpen(false),
      onError: (error) => showErrorToast(error),
    });
  };

  /** 발송은 되돌릴 수 없으므로 대상 수를 명시한 확인 다이얼로그를 반드시 거친다. */
  const handleSend = (campaign: PushCampaign) => {
    openConfirm({
      title: "푸시를 지금 발송할까요?",
      description: `'${truncate(campaign.title, 24)}'를 ${PUSH_TARGET_LABEL[campaign.target]} ${formatWithCommas(campaign.targetCount)}명에게 발송합니다.`,
      warning:
        "발송한 푸시는 취소하거나 회수할 수 없습니다. 대상과 문구를 다시 확인해 주세요.",
      confirmText: "발송",
      tone: "danger",
      onConfirm: () =>
        sendMutation
          .mutateAsync(campaign.campaignId)
          .catch((error) => showErrorToast(error)),
    });
  };

  const handleDelete = (campaign: PushCampaign) => {
    openConfirm({
      title: "푸시 캠페인을 삭제할까요?",
      description: `'${truncate(campaign.title, 24)}' 캠페인이 즉시 삭제됩니다.`,
      warning: "삭제한 캠페인은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation
          .mutateAsync(campaign.campaignId)
          .catch((error) => showErrorToast(error)),
    });
  };

  const columns: TableColumn<PushCampaign>[] = [
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <div className="max-w-100">
          <p className="truncate text-font-1">{row.title}</p>
          <p className="mt-0.5 truncate body-6 text-font-2">{row.body}</p>
        </div>
      ),
    },
    {
      key: "target",
      header: "대상",
      width: "120px",
      render: (row) => <Badge tone="brand">{PUSH_TARGET_LABEL[row.target]}</Badge>,
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (row) => (
        <Badge tone={PUSH_STATUS_TONE[row.status]}>
          {PUSH_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "targetCount",
      header: "대상 수",
      width: "100px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="text-font-1">{formatWithCommas(row.targetCount)}</span>
      ),
    },
    {
      key: "successCount",
      header: "성공 수",
      width: "100px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className={row.successCount > 0 ? "text-font-1" : "text-font-2"}>
          {row.status === "SENT" ? formatWithCommas(row.successCount) : "-"}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      header: "예약 일시",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.scheduledAt)}</span>
      ),
    },
    {
      key: "sentAt",
      header: "발송 일시",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.sentAt)}</span>
      ),
    },
    {
      key: "createdBy",
      header: "작성자",
      width: "100px",
      render: (row) => (
        <span className="text-font-2">
          {formatAdmin(row.createdBy, row.createdById)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "관리",
      width: "128px",
      align: "right",
      render: (row) => {
        // 이미 발송된 캠페인은 다시 보내거나 지울 수 없다.
        const isSent = row.status === "SENT";

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              leftIcon={<Megaphone size={14} />}
              disabled={isSent || sendMutation.isPending}
              onClick={() => handleSend(row)}
            >
              발송
            </Button>
            <IconButton
              label="삭제"
              icon={<Trash size={16} />}
              tone="danger"
              disabled={isSent}
              onClick={() => handleDelete(row)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Alert tone="warning" title="MOCK 화면 · 아직 실제 발송으로 이어지지 않습니다">
        현재 운영에서는 Discord로 처리합니다. 화면은 이후 전환을 위해 미리
        구현해 두었습니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="제목 · 본문으로 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              options={PUSH_STATUS_OPTIONS}
              value={status}
              onChange={(event) =>
                handleChangeStatus(event.target.value as PushStatus | "")
              }
              selectBoxClassName="w-40"
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              푸시 작성
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.campaignId)}
          isLoading={isLoading}
          emptyTitle="조회된 푸시 캠페인이 없습니다."
          emptyDescription="검색 조건을 바꾸거나 새 푸시를 작성해 보세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsFormOpen(true)}
            >
              푸시 작성
            </Button>
          }
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <PushCampaignFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
};

export default PushCampaignManager;
