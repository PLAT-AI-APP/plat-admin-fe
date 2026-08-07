"use client";

import { useState } from "react";
import { useKeywordParam } from "@/hooks/useKeywordParam";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import { useHashtagMutation } from "@/api/hashtag/mutateHashtag";
import { Edit, Plus, Trash } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDate } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import {
  HASHTAG_CATEGORY_LABEL,
  HASHTAG_LANGUAGES,
  HASHTAG_LANGUAGE_LABEL,
  countTranslations,
  type Hashtag,
  type HashtagCategory,
  type HashtagFormValues,
} from "@/type/hashtag";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import HashtagFormModal from "./HashtagFormModal";
import {
  HASHTAG_CATEGORY_FILTER_OPTIONS,
  HASHTAG_CATEGORY_TONE,
  HASHTAG_SORT_OPTIONS,
  HASHTAG_STATUS_FILTER_OPTIONS,
} from "./hashtagOptions";

type HashtagSort = "ORDER" | "USAGE" | "RECENT";

/** CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다. */
const HASHTAG_CSV_COLUMNS: CsvColumn<Hashtag>[] = [
  { header: "ID", value: (row) => row.hashtagId },
  ...HASHTAG_LANGUAGES.map((language) => ({
    header: HASHTAG_LANGUAGE_LABEL[language],
    value: (row: Hashtag) => row.labels[language],
  })),
  { header: "분류", value: (row) => HASHTAG_CATEGORY_LABEL[row.category] },
  { header: "성인 전용", value: (row) => (row.isAdult ? "Y" : "N") },
  { header: "노출", value: (row) => (row.isActive ? "노출" : "중지") },
  { header: "사용 수", value: (row) => row.usageCount },
  { header: "등록일", value: (row) => formatDate(row.createdAt) },
];

const HashtagManager = () => {
  const [page, setPage] = useState(1);
  // 전역 검색(⌘K)에서 넘어온 검색어를 초기값으로 쓰고, 화면에서 검색하면 그 값이 우선한다.
  const keywordParam = useKeywordParam();
  const [draftKeyword, setDraftKeyword] = useState<string | null>(null);
  const keyword = draftKeyword ?? keywordParam;
  const setKeyword = setDraftKeyword;
  const [category, setCategory] = useState<HashtagCategory | "">("");
  const [isActive, setIsActive] = useState("");
  const [sort, setSort] = useState<HashtagSort>("ORDER");

  const [editingHashtag, setEditingHashtag] = useState<Hashtag | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading } = useHashtagListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    category,
    isActive,
    sort,
  });

  const { createMutation, updateMutation, statusMutation, deleteMutation } =
    useHashtagMutation();

  const hashtags = data?.content ?? [];

  /** 필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 1로 되돌린다. */
  const resetPage = () => setPage(1);

  const handleOpenCreate = () => {
    setEditingHashtag(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hashtag: Hashtag) => {
    setEditingHashtag(hashtag);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: HashtagFormValues) => {
    const options = { onSuccess: () => setIsFormOpen(false) };

    if (editingHashtag) {
      updateMutation.mutate(
        { hashtagId: editingHashtag.hashtagId, values },
        options,
      );
      return;
    }

    createMutation.mutate(values, options);
  };

  const handleToggleActive = (hashtag: Hashtag, nextActive: boolean) => {
    statusMutation.mutate({
      hashtagId: hashtag.hashtagId,
      isActive: nextActive,
    });
  };

  const handleDelete = (hashtag: Hashtag) => {
    // 사용 중인 태그는 서버가 막지만, 눌러보기 전에 미리 알려준다.
    if (hashtag.usageCount > 0) {
      showErrorToast(
        new Error(
          `'${hashtag.labels.KO}' 태그는 ${formatWithCommas(hashtag.usageCount)}곳에서 사용 중입니다. 노출을 끄는 방식으로 관리해 주세요.`,
        ),
      );
      return;
    }

    openConfirm({
      title: "해시태그를 삭제할까요?",
      description: `'${hashtag.labels.KO}' 태그가 선택 목록에서 완전히 제거됩니다.`,
      warning: "삭제한 해시태그는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(hashtag.hashtagId),
    });
  };

  const columns: TableColumn<Hashtag>[] = [
    {
      key: "label",
      header: "해시태그",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-font-1">#{row.labels.KO}</span>
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
      render: (row) => {
        const filled = countTranslations(row.labels);

        return (
          <span
            className={
              filled === HASHTAG_LANGUAGES.length
                ? "text-font-2 tabular-nums"
                : "text-warning tabular-nums"
            }
            title={HASHTAG_LANGUAGES.map(
              (language) =>
                `${HASHTAG_LANGUAGE_LABEL[language]}: ${row.labels[language] || "-"}`,
            ).join("\n")}
          >
            {filled}/{HASHTAG_LANGUAGES.length}
          </span>
        );
      },
    },
    {
      key: "usageCount",
      header: "사용 수",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.usageCount),
    },
    {
      key: "isActive",
      header: "노출",
      align: "center",
      render: (row) => (
        <Switch
          label={`${row.labels.KO} 노출 여부`}
          checked={row.isActive}
          onChange={(next) => handleToggleActive(row, next)}
          disabled={statusMutation.isPending}
        />
      ),
    },
    {
      key: "createdAt",
      header: "등록일",
      render: (row) => (
        <span className="text-font-2">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "관리",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEdit(row)}
          />
          <IconButton
            label="삭제"
            icon={<Trash size={16} />}
            tone="danger"
            onClick={() => handleDelete(row)}
          />
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
            onSearch={(next) => {
              setKeyword(next);
              resetPage();
            }}
            placeholder="해시태그 이름 · ID 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="분류 필터"
              options={HASHTAG_CATEGORY_FILTER_OPTIONS}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as HashtagCategory | "");
                resetPage();
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="노출 상태 필터"
              options={HASHTAG_STATUS_FILTER_OPTIONS}
              value={isActive}
              onChange={(event) => {
                setIsActive(event.target.value);
                resetPage();
              }}
              selectBoxClassName="w-32"
            />

            <Select
              aria-label="정렬"
              options={HASHTAG_SORT_OPTIONS}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as HashtagSort);
                resetPage();
              }}
              selectBoxClassName="w-32"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={hashtags}
          getRowKey={(row) => String(row.hashtagId)}
          isLoading={isLoading}
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
          onChange={setPage}
        />
      </Card>

      <HashtagFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        hashtag={editingHashtag}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default HashtagManager;
