"use client";

import { useRouter } from "next/navigation";
import { useListParams } from "@/hooks/useListParams";
import { useCharacterListQuery } from "@/api/character/getCharacterList";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  OFFICIAL_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "../../_constants/character";
import CharacterCell from "./CharacterCell";
import { buildCharacterActions } from "./characterActions";

/** 주소에 실리는 목록 조건. 전역 검색(⌘K)이 넘겨 주는 keyword도 여기로 들어온다. */
const DEFAULT_PARAMS = { page: 1, keyword: "", visibility: "", isOfficial: "" };

const CharacterManager = () => {
  const router = useRouter();
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, isOfficial } = params;
  const visibility = params.visibility as CharacterVisibility | "";

  const { data, isLoading } = useCharacterListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    visibility,
    isOfficial,
  });
  const { visibilityMutation, deleteMutation } = useCharacterMutation();

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

  const handleChangeVisibility = (
    character: Character,
    visibility: CharacterVisibility,
  ) => {
    visibilityMutation.mutate({
      characterId: character.characterId,
      visibility,
    });
  };

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
      key: "universeCount",
      header: "등장 세계관",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.universeCount),
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
        // 행 클릭(상세 페이지 이동)과 겹치지 않도록 액션 영역의 클릭은 여기서 멈춘다.
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Dropdown
            items={buildCharacterActions({
              character: row,
              onChangeVisibility: (visibility) =>
                handleChangeVisibility(row, visibility),
              onDelete: () => handleDelete(row),
            })}
          />
        </div>
      ),
    },
  ];

  return (
    <Card noPadding>
      <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
        <SearchInput
          value={keyword}
          onSearch={(next) => setParams({ keyword: next })}
          placeholder="캐릭터명, 크리에이터, 태그 검색"
        />

        <div className="flex items-center gap-2">
          <Select
            options={VISIBILITY_FILTER_OPTIONS}
            value={visibility}
            onChange={(event) => {
              setParams({ visibility: event.target.value });
            }}
            selectBoxClassName="w-40"
            aria-label="노출 상태 필터"
          />

          <Select
            options={OFFICIAL_FILTER_OPTIONS}
            value={isOfficial}
            onChange={(event) => {
              setParams({ isOfficial: event.target.value });
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
        onRowClick={(row) => router.push(`/universes/characters/${row.characterId}`)}
        emptyTitle="조건에 맞는 캐릭터가 없습니다."
        emptyDescription="검색어를 지우거나 필터를 전체로 바꿔 보세요."
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={DEFAULT_PAGE_SIZE}
        onChange={(next) => setParams({ page: next })}
      />
    </Card>
  );
};

export default CharacterManager;
