"use client";

import { useState } from "react";
import { useKeywordParam } from "@/hooks/useKeywordParam";
import { useCharacterListQuery } from "@/api/character/getCharacterList";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { Eye, EyeOff, Ban, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  OFFICIAL_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "../_constants/character";
import CharacterCell from "./CharacterCell";
import CharacterDetailModal from "./CharacterDetailModal";

/** 노출 상태 변경 드롭다운에 노출할 순서 */
const VISIBILITY_ACTIONS: CharacterVisibility[] = [
  "PUBLIC",
  "PRIVATE",
  "HIDDEN",
];

const VISIBILITY_ACTION_ICON: Record<CharacterVisibility, React.ReactNode> = {
  PUBLIC: <Eye size={15} />,
  PRIVATE: <EyeOff size={15} />,
  HIDDEN: <Ban size={15} />,
};

const CharacterManager = () => {
  const [page, setPage] = useState(1);
  // 전역 검색(⌘K)에서 넘어온 검색어를 초기값으로 쓰고, 화면에서 검색하면 그 값이 우선한다.
  const keywordParam = useKeywordParam();
  const [draftKeyword, setDraftKeyword] = useState<string | null>(null);
  const keyword = draftKeyword ?? keywordParam;
  const setKeyword = setDraftKeyword;
  const [visibility, setVisibility] = useState<CharacterVisibility | "">("");
  const [isOfficial, setIsOfficial] = useState("");
  const [detailCharacterId, setDetailCharacterId] = useState<number | null>(
    null,
  );

  const { data, isLoading } = useCharacterListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    visibility,
    isOfficial,
  });
  const { visibilityMutation, deleteMutation } = useCharacterMutation();

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleDelete = (character: Character) => {
    openConfirm({
      title: "캐릭터를 삭제할까요?",
      description: `'${character.name}' 캐릭터가 앱에서 즉시 노출 중단됩니다.`,
      warning: "삭제한 캐릭터는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(character.characterId),
    });
  };

  /** 행 액션 드롭다운. 현재 상태로는 다시 바꿀 수 없도록 비활성화한다. */
  const buildRowActions = (character: Character): DropdownItem[] => [
    ...VISIBILITY_ACTIONS.map((next) => ({
      label: `${VISIBILITY_LABEL[next]}(으)로 변경`,
      icon: VISIBILITY_ACTION_ICON[next],
      disabled: character.visibility === next,
      onSelect: () =>
        visibilityMutation.mutate({
          characterId: character.characterId,
          visibility: next,
        }),
    })),
    {
      label: "삭제",
      icon: <Trash size={15} />,
      tone: "danger" as const,
      onSelect: () => handleDelete(character),
    },
  ];

  const columns: TableColumn<Character>[] = [
    {
      key: "character",
      header: "캐릭터",
      width: "220px",
      render: (row) => <CharacterCell character={row} />,
    },
    {
      key: "creator",
      header: "크리에이터",
      render: (row) => (
        <span className="text-[13px] text-font-2">{row.creatorNickname}</span>
      ),
    },
    {
      key: "official",
      header: "공식 여부",
      align: "center",
      render: (row) =>
        row.isOfficial ? (
          <Badge tone="brand">공식</Badge>
        ) : (
          <Badge tone="neutral">일반</Badge>
        ),
    },
    {
      key: "visibility",
      header: "노출 상태",
      align: "center",
      render: (row) => (
        <Badge tone={VISIBILITY_TONE[row.visibility]}>
          {VISIBILITY_LABEL[row.visibility]}
        </Badge>
      ),
    },
    {
      key: "nsfw",
      header: "NSFW",
      align: "center",
      render: (row) =>
        row.isNsfw ? (
          <Badge tone="danger">NSFW</Badge>
        ) : (
          <span className="text-[13px] text-font-disabled">-</span>
        ),
    },
    {
      key: "scenarioCount",
      header: "세계관",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.scenarioCount),
    },
    {
      key: "assetCount",
      header: "에셋",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.assetCount),
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.chatCount),
    },
    {
      key: "createdAt",
      header: "생성일",
      align: "right",
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
      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="캐릭터명, 크리에이터, 태그 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              options={VISIBILITY_FILTER_OPTIONS}
              value={visibility}
              onChange={(event) => {
                setVisibility(event.target.value as CharacterVisibility | "");
                setPage(1);
              }}
              selectBoxClassName="w-40"
              aria-label="노출 상태 필터"
            />

            <Select
              options={OFFICIAL_FILTER_OPTIONS}
              value={isOfficial}
              onChange={(event) => {
                setIsOfficial(event.target.value);
                setPage(1);
              }}
              selectBoxClassName="w-40"
              aria-label="공식 여부 필터"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.characterId)}
          isLoading={isLoading}
          onRowClick={(row) => setDetailCharacterId(row.characterId)}
          emptyTitle="조건에 맞는 캐릭터가 없습니다."
          emptyDescription="검색어를 지우거나 필터를 전체로 바꿔 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <CharacterDetailModal
        characterId={detailCharacterId}
        onClose={() => setDetailCharacterId(null)}
      />
    </>
  );
};

export default CharacterManager;
