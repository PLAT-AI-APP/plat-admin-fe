"use client";

import { useState } from "react";
import { useListParams } from "@/hooks/useListParams";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import { useHashtagMutation } from "@/api/hashtag/mutateHashtag";
import { Edit, Plus, Trash } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDate } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE, type AppError } from "@/type/api";
import {
  HASHTAG_CATEGORY_LABEL,
  type Hashtag,
  type HashtagCategory,
  type HashtagFormValues,
  type HashtagSort,
} from "@/type/hashtag";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import HashtagDetailModal from "./HashtagDetailModal";
import HashtagFormModal from "./HashtagFormModal";
import {
  HASHTAG_ADULT_FILTER_OPTIONS,
  HASHTAG_CATEGORY_FILTER_OPTIONS,
  HASHTAG_CATEGORY_TONE,
  HASHTAG_SORT_OPTIONS,
  HASHTAG_STATUS_FILTER_OPTIONS,
} from "./hashtagOptions";

/**
 * CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다.
 * 언어별 번역은 목록 응답에 없으므로 채워진 개수만 담는다.
 */
const HASHTAG_CSV_COLUMNS: CsvColumn<Hashtag>[] = [
  { header: "ID", value: (row) => row.hashtagId },
  { header: "해시태그", value: (row) => row.name },
  { header: "분류", value: (row) => HASHTAG_CATEGORY_LABEL[row.category] },
  { header: "성인 전용", value: (row) => (row.isAdult ? "Y" : "N") },
  {
    header: "번역",
    value: (row) => `${row.translationCount}/${row.totalTranslationCount}`,
  },
  { header: "사용 수", value: (row) => row.usageCount },
  { header: "등록일", value: (row) => formatDate(row.createdAt) },
  { header: "노출", value: (row) => (row.isActive ? "노출" : "중지") },
];

/** 주소에 실리는 목록 조건. 전역 검색(⌘K)이 넘겨 주는 keyword도 여기로 들어온다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  category: "",
  isActive: "",
  isAdult: "",
  sort: "CREATED_DESC",
};

const HashtagManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, isActive, isAdult } = params;
  const category = params.category as HashtagCategory | "";
  const sort = params.sort as HashtagSort;

  /** 수정 대상 ID. 언어별 라벨은 목록에 없어 모달이 상세를 따로 받아 온다. */
  const [editingHashtagId, setEditingHashtagId] = useState<number>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailHashtag, setDetailHashtag] = useState<Hashtag | null>(null);

  const { data, isLoading } = useHashtagListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    category,
    isActive,
    isAdult,
    sort,
  });

  const { createMutation, updateMutation, statusMutation, deleteMutation } =
    useHashtagMutation();

  const hashtags = data?.content ?? [];

  const handleOpenCreate = () => {
    setEditingHashtagId(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hashtagId: number) => {
    // 상세에서 넘어온 경우 모달이 겹치지 않도록 상세를 먼저 닫는다.
    setDetailHashtag(null);
    setEditingHashtagId(hashtagId);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: HashtagFormValues) => {
    const options = {
      onSuccess: () => setIsFormOpen(false),
      onError: (error: AppError) => showErrorToast(error),
    };

    if (editingHashtagId !== undefined) {
      updateMutation.mutate({ hashtagId: editingHashtagId, values }, options);
      return;
    }

    createMutation.mutate(values, options);
  };

  const handleToggleActive = (hashtag: Hashtag, nextActive: boolean) => {
    statusMutation.mutate(
      { hashtagId: hashtag.hashtagId, isActive: nextActive },
      { onError: (error) => showErrorToast(error) },
    );
  };

  const handleDelete = (hashtag: Hashtag) => {
    // 사용 중인 태그는 서버가 막지만, 눌러보기 전에 미리 알려준다.
    if (hashtag.usageCount > 0) {
      showErrorToast(
        new Error(
          `'${hashtag.name}' 태그는 ${formatWithCommas(hashtag.usageCount)}곳에서 사용 중입니다. 노출을 끄는 방식으로 관리해 주세요.`,
        ),
      );
      return;
    }

    openConfirm({
      title: "해시태그를 삭제할까요?",
      description: `'${hashtag.name}' 태그가 선택 목록에서 완전히 제거됩니다.`,
      warning: "삭제한 해시태그는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation.mutateAsync(hashtag.hashtagId).catch(showErrorToast),
    });
  };

  /**
   * 행 액션. 아이콘 버튼을 늘리지 않고 더보기 메뉴 하나로 모은다.
   * **상세 보기는 넣지 않는다** — 행을 누르면 어차피 상세가 열린다.
   */
  const buildRowActions = (hashtag: Hashtag): DropdownItem[] => [
    {
      label: "수정",
      icon: <Edit size={15} />,
      onSelect: () => handleOpenEdit(hashtag.hashtagId),
    },
    {
      label: "삭제",
      icon: <Trash size={15} />,
      tone: "danger",
      onSelect: () => handleDelete(hashtag),
    },
  ];

  const columns: TableColumn<Hashtag>[] = [
    {
      key: "name",
      header: "해시태그",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-font-1">#{row.name}</span>
          {row.isAdult && <Badge tone="danger">성인</Badge>}
        </div>
      ),
    },
    {
      key: "category",
      header: "분류",
      render: (row) => (
        <Badge tone={HASHTAG_CATEGORY_TONE[row.category]}>
          {HASHTAG_CATEGORY_LABEL[row.category]}
        </Badge>
      ),
    },
    {
      key: "translations",
      header: "번역",
      align: "center",
      render: (row) => (
        <span
          className={
            row.translationCount === row.totalTranslationCount
              ? "text-font-2 tabular-nums"
              : "text-warning tabular-nums"
          }
          title="언어별 번역은 상세에서 확인할 수 있습니다."
        >
          {row.translationCount}/{row.totalTranslationCount}
        </span>
      ),
    },
    {
      key: "usageCount",
      header: "사용 수",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.usageCount),
    },
    {
      key: "createdAt",
      header: "등록일",
      render: (row) => (
        <span className="text-font-2">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "isActive",
      header: "노출",
      align: "right",
      width: "80px",
      render: (row) => (
        // 행 클릭(상세 모달)과 겹치지 않도록 스위치 영역의 클릭은 여기서 멈춘다.
        <div
          className="flex justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <Switch
            label={`${row.name} 노출 여부`}
            checked={row.isActive}
            onChange={(next) => handleToggleActive(row, next)}
            disabled={statusMutation.isPending}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (row) => (
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
      <Alert
        tone="info"
        title="사용자는 여기 등록된 태그만 사용할 수 있습니다."
      >
        캐릭터·세계관에 붙는 해시태그는 자유 입력이 아니라 이 목록에서 선택하는
        방식입니다. 이미 사용 중인 태그는 삭제 대신 노출을 끄는 방식으로 관리해
        주세요.
      </Alert>

      <Card
        title={`해시태그 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="분류별로 묶여 사용자 선택 화면에 노출됩니다."
        action={
          <>
            <CsvExportButton
              fileName="해시태그"
              rows={hashtags}
              columns={HASHTAG_CSV_COLUMNS}
              disabled={isLoading}
            />

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              해시태그 추가
            </Button>
          </>
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="이름 · 번역 · ID 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="분류 필터"
              options={HASHTAG_CATEGORY_FILTER_OPTIONS}
              value={category}
              onChange={(event) => setParams({ category: event.target.value })}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="노출 상태 필터"
              options={HASHTAG_STATUS_FILTER_OPTIONS}
              value={isActive}
              onChange={(event) => setParams({ isActive: event.target.value })}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="성인 태그 필터"
              options={HASHTAG_ADULT_FILTER_OPTIONS}
              value={isAdult}
              onChange={(event) => setParams({ isAdult: event.target.value })}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="정렬"
              options={HASHTAG_SORT_OPTIONS}
              value={sort}
              onChange={(event) => setParams({ sort: event.target.value })}
              selectBoxClassName="w-32"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={hashtags}
          getRowKey={(row) => String(row.hashtagId)}
          isLoading={isLoading}
          onRowClick={setDetailHashtag}
          emptyTitle="등록된 해시태그가 없습니다."
          emptyDescription="사용자가 고를 수 있도록 자주 쓰는 태그부터 등록해 주세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              해시태그 추가
            </Button>
          }
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <HashtagDetailModal
        hashtag={detailHashtag}
        onClose={() => setDetailHashtag(null)}
        onEdit={handleOpenEdit}
      />

      <HashtagFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        hashtagId={editingHashtagId}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default HashtagManager;
