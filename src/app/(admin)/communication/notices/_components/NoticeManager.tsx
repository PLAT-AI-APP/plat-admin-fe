"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useNoticeListQuery } from "@/api/notice/getNoticeList";
import { useNoticeMutation } from "@/api/notice/mutateNotice";
import { Ban, Edit, Eye, Megaphone, Plus, Star, Trash } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDateTime } from "@/lib/dayjs";
import { formatWithCommas, truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  NOTICE_CATEGORY_LABEL,
  NOTICE_STATUS_LABEL,
  type Notice,
  type NoticeCategory,
  type NoticeFormValues,
  type NoticeStatus,
} from "@/type/notice";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { TableCellStack, type TableColumn } from "@/components/ui/Table";
import NoticeFormModal from "./NoticeFormModal";
import NoticeViewModal from "./NoticeViewModal";
import {
  NOTICE_CATEGORY_FILTER_OPTIONS,
  NOTICE_CATEGORY_TONE,
  NOTICE_STATUS_FILTER_OPTIONS,
  NOTICE_STATUS_TONE,
} from "./noticeOptions";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const NOTICE_CSV_COLUMNS: CsvColumn<Notice>[] = [
  { header: "ID", value: (row) => row.noticeId },
  { header: "분류", value: (row) => NOTICE_CATEGORY_LABEL[row.category] },
  { header: "제목", value: (row) => row.title },
  { header: "상태", value: (row) => NOTICE_STATUS_LABEL[row.status] },
  { header: "고정", value: (row) => (row.isPinned ? "Y" : "N") },
  { header: "조회 수", value: (row) => row.viewCount },
  { header: "작성자", value: (row) => row.createdBy },
  { header: "등록일", value: (row) => formatDateTime(row.createdAt) },
  { header: "수정일", value: (row) => formatDateTime(row.updatedAt) },
];

const NoticeManager = () => {
  // 댓글 관리에서 대상 공지를 누르면 `?noticeId=`를 달고 넘어온다. 그 공지를 바로 연다.
  const linkedNoticeId = useSearchParams().get("noticeId");

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<NoticeCategory | "">("");
  const [status, setStatus] = useState<NoticeStatus | "">("");

  const [editingNotice, setEditingNotice] = useState<Notice | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingNoticeId, setViewingNoticeId] = useState<number | null>(
    linkedNoticeId ? Number(linkedNoticeId) : null,
  );

  const { data, isLoading } = useNoticeListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    category,
    status,
  });

  const { createMutation, updateMutation, statusMutation, deleteMutation } =
    useNoticeMutation();

  const notices = data?.content ?? [];

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 1로 되돌린다. */
  const resetPage = () => setPage(1);

  const handleOpenCreate = () => {
    setEditingNotice(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    // 상세에서 넘어온 경우 모달이 겹치지 않도록 상세를 먼저 닫는다.
    setViewingNoticeId(null);
    setEditingNotice(notice);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: NoticeFormValues) => {
    const options = { onSuccess: () => setIsFormOpen(false) };

    if (editingNotice) {
      updateMutation.mutate(
        { noticeId: editingNotice.noticeId, values },
        options,
      );
      return;
    }

    createMutation.mutate(values, options);
  };

  const handlePublish = (notice: Notice) => {
    openConfirm({
      title: "공지를 게시할까요?",
      description: `'${truncate(notice.title, 30)}' 공지가 앱에 즉시 노출됩니다.`,
      confirmText: "게시",
      onConfirm: () =>
        statusMutation.mutateAsync({
          noticeId: notice.noticeId,
          status: "PUBLISHED",
        }),
    });
  };

  const handleHide = (notice: Notice) => {
    statusMutation.mutate({ noticeId: notice.noticeId, status: "HIDDEN" });
  };

  const handleDelete = (notice: Notice) => {
    openConfirm({
      title: "공지를 삭제할까요?",
      description: `'${truncate(notice.title, 30)}' 공지가 완전히 제거됩니다.`,
      warning: "삭제한 공지는 되돌릴 수 없습니다. 노출만 멈추려면 숨김을 쓰세요.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(notice.noticeId),
    });
  };

  /** 행 액션. 아이콘 버튼을 늘리지 않고 더보기 메뉴 하나로 모은다. */
  const buildRowActions = (notice: Notice): DropdownItem[] => [
    {
      label: "상세 보기",
      icon: <Eye size={15} />,
      onSelect: () => setViewingNoticeId(notice.noticeId),
    },
    notice.status === "PUBLISHED"
      ? {
          label: "숨김",
          icon: <Ban size={15} />,
          disabled: statusMutation.isPending,
          onSelect: () => handleHide(notice),
        }
      : {
          label: "게시",
          icon: <Megaphone size={15} />,
          disabled: statusMutation.isPending,
          onSelect: () => handlePublish(notice),
        },
    {
      label: "수정",
      icon: <Edit size={15} />,
      onSelect: () => handleOpenEdit(notice),
    },
    {
      label: "삭제",
      icon: <Trash size={15} />,
      tone: "danger",
      onSelect: () => handleDelete(notice),
    },
  ];

  const columns: TableColumn<Notice>[] = [
    {
      key: "category",
      header: "분류",
      width: "100px",
      render: (row) => (
        <Badge tone={NOTICE_CATEGORY_TONE[row.category]}>
          {NOTICE_CATEGORY_LABEL[row.category]}
        </Badge>
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-1.5">
          {row.isPinned && (
            <span className="shrink-0 text-brand" title="상단 고정">
              <Star size={14} />
            </span>
          )}
          <TableCellStack
            primary={
              <span className="max-w-120 truncate">{row.title}</span>
            }
            secondary={`#${row.noticeId} · ${row.createdBy}`}
          />
        </div>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "110px",
      render: (row) => (
        <Badge tone={NOTICE_STATUS_TONE[row.status]}>
          {NOTICE_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "viewCount",
      header: "조회 수",
      align: "right",
      numeric: true,
      width: "100px",
      render: (row) => formatWithCommas(row.viewCount),
    },
    {
      key: "updatedAt",
      header: "수정일",
      width: "150px",
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (row) => (
        // 행 클릭(상세 모달)과 겹치지 않도록 액션 영역의 클릭은 여기서 멈춘다.
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Dropdown items={buildRowActions(row)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title={`공지사항 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="행을 클릭하면 본문을 확인할 수 있습니다. 고정 공지가 항상 위에 오고, 그 안에서는 최신순으로 정렬됩니다."
        action={
          <>
            <CsvExportButton
              fileName="공지사항"
              rows={notices}
              columns={NOTICE_CSV_COLUMNS}
              disabled={isLoading}
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              공지 등록
            </Button>
          </>
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => {
              setKeyword(next);
              resetPage();
            }}
            placeholder="제목 · 본문 · ID 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="분류 필터"
              options={NOTICE_CATEGORY_FILTER_OPTIONS}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as NoticeCategory | "");
                resetPage();
              }}
              selectBoxClassName="w-36"
            />

            <Select
              aria-label="상태 필터"
              options={NOTICE_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as NoticeStatus | "");
                resetPage();
              }}
              selectBoxClassName="w-36"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={notices}
          getRowKey={(row) => String(row.noticeId)}
          isLoading={isLoading}
          onRowClick={(row) => setViewingNoticeId(row.noticeId)}
          emptyTitle="등록된 공지사항이 없습니다."
          emptyDescription="점검·업데이트·이벤트 안내를 등록해 보세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              공지 등록
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

      <NoticeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        notice={editingNotice}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <NoticeViewModal
        noticeId={viewingNoticeId}
        onClose={() => setViewingNoticeId(null)}
        onEdit={handleOpenEdit}
      />
    </>
  );
};

export default NoticeManager;
