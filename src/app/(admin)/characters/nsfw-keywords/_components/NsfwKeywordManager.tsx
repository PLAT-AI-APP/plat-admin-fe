"use client";

import { useState } from "react";
import { useNsfwKeywordListQuery } from "@/api/character/getNsfwKeywordList";
import { useNsfwKeywordMutation } from "@/api/character/mutateNsfwKeyword";
import { Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";
import type { NsfwKeywordSchema } from "@/schema/nsfwKeyword.schema";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { NsfwKeyword, NsfwKeywordLevel } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  NSFW_LEVEL_FILTER_OPTIONS,
  NSFW_LEVEL_LABEL,
  NSFW_LEVEL_TONE,
} from "../../_constants/character";
import NsfwKeywordAddForm from "./NsfwKeywordAddForm";

const NsfwKeywordManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<NsfwKeywordLevel | "">("");

  const { data, isLoading } = useNsfwKeywordListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    level,
  });
  const { createMutation, deleteMutation } = useNsfwKeywordMutation();

  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  /** 중복 키워드는 서버가 409로 돌려주므로 이 화면에서만 에러 토스트를 붙인다. */
  const handleCreate = (values: NsfwKeywordSchema, onSuccess: () => void) => {
    createMutation.mutate(values, {
      onSuccess,
      onError: (error) => showErrorToast(error),
    });
  };

  const handleDelete = (row: NsfwKeyword) => {
    openConfirm({
      title: "키워드를 삭제할까요?",
      description: `'${row.keyword}' 키워드가 즉시 필터에서 제외됩니다.`,
      warning: "삭제 이후 생성되는 캐릭터·대화는 이 키워드를 검사하지 않습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(row.keywordId),
    });
  };

  const columns: TableColumn<NsfwKeyword>[] = [
    {
      key: "keyword",
      header: "키워드",
      render: (row) => (
        <span className="text-[14px] font-medium text-font-1">
          {row.keyword}
        </span>
      ),
    },
    {
      key: "level",
      header: "레벨",
      align: "center",
      width: "110px",
      render: (row) => (
        <Badge tone={NSFW_LEVEL_TONE[row.level]}>
          {NSFW_LEVEL_LABEL[row.level]}
        </Badge>
      ),
    },
    {
      key: "hitCount",
      header: "적중 수",
      align: "right",
      width: "110px",
      numeric: true,
      render: (row) => formatWithCommas(row.hitCount),
    },
    {
      key: "createdAt",
      header: "등록일",
      align: "right",
      width: "130px",
      numeric: true,
      render: (row) => (
        <span className="text-[13px] text-font-2">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (row) => (
        <div className="flex justify-center">
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
      <Alert tone="info">
        등록한 키워드는 캐릭터 생성과 대화 검수에 함께 적용됩니다. 적중 수가 많은
        키워드는 오탐이 없는지 주기적으로 확인해 주세요.
      </Alert>

      <NsfwKeywordAddForm
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="키워드 검색"
          />

          <Select
            options={NSFW_LEVEL_FILTER_OPTIONS}
            value={level}
            onChange={(event) => {
              setLevel(event.target.value as NsfwKeywordLevel | "");
              setPage(1);
            }}
            selectBoxClassName="w-40"
            aria-label="레벨 필터"
          />
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.keywordId)}
          isLoading={isLoading}
          emptyTitle="등록된 키워드가 없습니다."
          emptyDescription="위 입력창에서 차단할 키워드를 추가해 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>
    </>
  );
};

export default NsfwKeywordManager;
