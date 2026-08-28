"use client";

import { useState } from "react";
import { useBannedWordListQuery } from "@/api/word/getBannedWordList";
import { useBannedWordMutation } from "@/api/word/mutateBannedWord";
import { Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatAdmin } from "@/lib/utils";
import type { BannedWordSchema } from "@/schema/bannedWord.schema";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  BannedWord,
  BannedWordLevel,
  BannedWordType,
} from "@/type/bannedWord";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import {
  BANNED_WORD_LEVEL_CELL_OPTIONS,
  BANNED_WORD_LEVEL_FILTER_OPTIONS,
  BANNED_WORD_TYPE_TABS,
} from "../../_constants/bannedWord";
import BannedWordAddForm from "./BannedWordAddForm";

/** 탭마다 안내가 다르다. 두 표에서 운영자가 하는 일이 다르기 때문이다. */
const TAB_GUIDE: Record<BannedWordType, { title: string; body: string }> = {
  BAN: {
    title: "걸러 낼 단어입니다.",
    body: "너무 짧거나 다른 말에 흔히 섞이는 단어는 멀쩡한 글까지 막습니다. 그런 오탐이 확인되면 이 단어를 지우는 대신 예외어 탭에 그 표현을 더하는 편이 안전합니다 — 걸러야 할 표현은 그대로 두고 멀쩡한 말만 풀어 줍니다.",
  },
  EXCEPT: {
    title: "금지어를 되돌리는 단어입니다.",
    body: "금지어를 품고 있지만 문제가 없는 말을 등록합니다. '졸라'를 막아 둔 채 '고르곤졸라'만 통과시키는 식이라, 걸러야 할 표현은 그대로 두고 멀쩡한 말만 풀어 줍니다.",
  },
};

const BannedWordManager = () => {
  const [type, setType] = useState<BannedWordType>("BAN");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<BannedWordLevel | "">("");

  const isBan = type === "BAN";

  const { data, isLoading } = useBannedWordListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    type,
    // 예외어에는 레벨이 없다. 이전 탭의 필터가 따라가면 목록이 통째로 빈다.
    level: isBan ? level : "",
  });
  const { createMutation, levelMutation, deleteMutation } =
    useBannedWordMutation();

  /** 탭·필터가 바뀌면 이전 페이지 번호가 의미를 잃으므로 항상 1페이지로 되돌린다. */
  const handleChangeType = (next: BannedWordType) => {
    setType(next);
    setLevel("");
    setPage(1);
  };

  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  /** 중복 단어는 서버가 409로 돌려주므로 이 화면에서만 에러 토스트를 붙인다. */
  const handleCreate = (values: BannedWordSchema, onSuccess: () => void) => {
    createMutation.mutate(values, {
      onSuccess,
      onError: (error) => showErrorToast(error),
    });
  };

  const handleDelete = (row: BannedWord) => {
    openConfirm({
      title: isBan ? "금지어를 삭제할까요?" : "예외어를 삭제할까요?",
      description: `'${row.word}'를 사전에서 지웁니다. 저장 즉시 검사에서 빠집니다.`,
      warning: isBan
        ? "이 단어는 앞으로 걸러지지 않습니다."
        : "이 예외어가 풀어 주던 표현들이 다시 금지어로 걸립니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(row.bannedWordId),
    });
  };

  const wordColumn: TableColumn<BannedWord> = {
    key: "word",
    header: "단어",
    render: (row) => (
      <span className="body-4 font-medium text-font-1">{row.word}</span>
    ),
  };

  /** 금지어에만 있는 열. 예외어는 무엇도 막지 않아 고를 레벨이 없다. */
  const banColumns: TableColumn<BannedWord>[] = [
    {
      key: "level",
      header: "처리 레벨",
      align: "center",
      width: "120px",
      render: (row) =>
        row.level ? (
          <Select
            options={BANNED_WORD_LEVEL_CELL_OPTIONS}
            value={row.level}
            disabled={levelMutation.isPending}
            aria-label={`${row.word} 처리 레벨`}
            selectBoxClassName="h-9"
            onChange={(event) =>
              levelMutation.mutate({
                bannedWordId: row.bannedWordId,
                level: event.target.value as BannedWordLevel,
              })
            }
          />
        ) : (
          <span className="body-5 text-font-2">-</span>
        ),
    },
  ];

  const tailColumns: TableColumn<BannedWord>[] = [
    {
      key: "createdBy",
      header: "등록자",
      width: "160px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatAdmin(row.createdBy, row.createdById)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "등록일",
      align: "right",
      width: "130px",
      numeric: true,
      render: (row) => (
        <span className="body-5 text-font-2">{formatDate(row.createdAt)}</span>
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

  const columns: TableColumn<BannedWord>[] = [
    wordColumn,
    ...(isBan ? banColumns : []),
    ...tailColumns,
  ];

  return (
    <>
      <Alert tone="info" title={TAB_GUIDE[type].title}>
        {TAB_GUIDE[type].body}
      </Alert>

      <BannedWordAddForm
        type={type}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <Card noPadding>
        <Tabs
          items={BANNED_WORD_TYPE_TABS}
          value={type}
          onChange={handleChangeType}
          className="px-3"
        />

        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="단어 검색"
          />

          {isBan && (
            <Select
              options={BANNED_WORD_LEVEL_FILTER_OPTIONS}
              value={level}
              onChange={(event) => {
                setLevel(event.target.value as BannedWordLevel | "");
                setPage(1);
              }}
              selectBoxClassName="w-36"
              aria-label="레벨 필터"
            />
          )}
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.bannedWordId)}
          isLoading={isLoading}
          emptyTitle={
            isBan ? "등록된 금지어가 없습니다." : "등록된 예외어가 없습니다."
          }
          emptyDescription={
            isBan
              ? "위 입력창에서 걸러 낼 단어를 추가해 보세요."
              : "금지어에 걸리지만 문제가 없는 말을 추가해 오탐을 풀어 주세요."
          }
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

export default BannedWordManager;
