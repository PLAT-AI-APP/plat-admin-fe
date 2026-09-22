"use client";

import { useState } from "react";
import { useFaqListQuery } from "@/api/communication/getFaqList";
import { useFaqMutation } from "@/api/communication/mutateFaq";
import { useListParams } from "@/hooks/useListParams";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatAdmin, formatWithCommas } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { FaqCategory, FaqFormValues, FaqItem } from "@/type/communication";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";
import { Edit, Plus, Trash } from "@/icons";
import {
  FAQ_CATEGORY_FILTER_OPTIONS,
  FAQ_CATEGORY_LABEL,
  FAQ_CATEGORY_TONE,
} from "@/app/(admin)/communication/_constants/communicationOptions";
import FaqFormModal from "./FaqFormModal";

/** 주소에 실리는 목록 조건 */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  category: "",
};

const FaqManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const category = params.category as FaqCategory | "";
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | undefined>();
  const canWrite = useHasPermission("faq:write");
  const canDelete = useHasPermission("faq:delete");

  const { data, isLoading } = useFaqListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    category,
  });
  const { createMutation, updateMutation, visibilityMutation, deleteMutation } =
    useFaqMutation();

  const handleOpenCreate = () => {
    setEditingFaq(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: FaqFormValues) => {
    const options = {
      onSuccess: () => setIsFormOpen(false),
      onError: (caught: unknown) => showErrorToast(caught),
    };

    if (editingFaq) {
      updateMutation.mutate({ faqId: editingFaq.faqId, values }, options);
    } else {
      createMutation.mutate(values, options);
    }
  };

  const handleDelete = (faq: FaqItem) =>
    openConfirm({
      title: "FAQ를 삭제할까요?",
      description: `'${faq.question}'`,
      warning: "삭제한 FAQ는 되돌릴 수 없습니다. 잠시 내리려면 노출을 끄세요.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(faq.faqId);
      },
    });

  /* 권한이 없는 행위는 메뉴에서 뺀다. 둘 다 없으면 메뉴 열째로 뺀다. */
  const buildRowActions = (faq: FaqItem): DropdownItem[] => [
    ...(canWrite
      ? [
          {
            label: "수정",
            icon: <Edit size={15} />,
            onSelect: () => handleOpenEdit(faq),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: "삭제",
            icon: <Trash size={15} />,
            tone: "danger" as const,
            onSelect: () => handleDelete(faq),
          },
        ]
      : []),
  ];

  const columns: TableColumn<FaqItem>[] = [
    {
      key: "category",
      header: "카테고리",
      width: "110px",
      render: (row) => (
        <Badge tone={FAQ_CATEGORY_TONE[row.category]}>
          {FAQ_CATEGORY_LABEL[row.category]}
        </Badge>
      ),
    },
    {
      key: "sortOrder",
      header: "순서",
      width: "70px",
      numeric: true,
      render: (row) => <span className="text-font-2">{row.sortOrder}</span>,
    },
    {
      key: "question",
      header: "질문 / 답변",
      render: (row) => (
        <TableCellStack
          primary={<span className="block max-w-120 truncate">{row.question}</span>}
          secondary={<span className="block max-w-120 truncate">{row.answer}</span>}
        />
      ),
    },
    {
      key: "isVisible",
      header: "노출",
      width: "80px",
      render: (row) => (
        // 행 클릭(수정)과 겹치지 않도록 토글 클릭은 여기서 멈춘다.
        <div onClick={(event) => event.stopPropagation()}>
          <Switch
            checked={row.isVisible}
            label={`${row.question} 노출`}
            disabled={!canWrite || visibilityMutation.isPending}
            onChange={(isVisible) =>
              visibilityMutation.mutate(
                { faqId: row.faqId, isVisible },
                { onError: (caught) => showErrorToast(caught) },
              )
            }
          />
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "최종 수정",
      width: "180px",
      numeric: true,
      render: (row) => (
        <TableCellStack
          primary={
            <span className="body-5 text-font-2">{formatDateTime(row.updatedAt)}</span>
          }
          secondary={formatAdmin(row.updatedBy, row.updatedById ?? undefined)}
        />
      ),
    },
    ...(canWrite || canDelete
      ? [
          {
            key: "actions",
            header: "",
            width: "56px",
            render: (row: FaqItem) => (
              <div
                className="flex justify-end"
                onClick={(event) => event.stopPropagation()}
              >
                <Dropdown items={buildRowActions(row)} />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card
        title={`FAQ ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description={
          canWrite
            ? "유저 화면과 같은 순서(카테고리 → 순서)로 정렬됩니다. 행을 클릭하면 수정합니다."
            : "유저 화면과 같은 순서(카테고리 → 순서)로 정렬됩니다."
        }
        action={
          canWrite && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              FAQ 등록
            </Button>
          )
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="질문 · 답변으로 검색"
          />

          <Select
            aria-label="카테고리 필터"
            options={FAQ_CATEGORY_FILTER_OPTIONS}
            value={category}
            onChange={(event) => setParams({ category: event.target.value })}
            selectBoxClassName="w-44"
          />
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => row.faqId}
          isLoading={isLoading}
          onRowClick={canWrite ? handleOpenEdit : undefined}
          emptyTitle="등록된 FAQ가 없습니다."
          emptyDescription="유저가 자주 묻는 질문을 등록해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <FaqFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        faq={editingFaq}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default FaqManager;
