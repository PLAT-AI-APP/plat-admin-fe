"use client";

import { useState } from "react";
import { useOfficialCharacterListQuery } from "@/api/character/getOfficialCharacterList";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import { useOfficialCharacterMutation } from "@/api/character/mutateOfficialCharacter";
import { Crown, Edit, Plus, Trash } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { OfficialCharacterSchema } from "@/schema/officialCharacter.schema";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import CharacterCell from "../../_components/CharacterCell";
import CharacterDetailModal from "../../_components/CharacterDetailModal";
import {
  VISIBILITY_FILTER_OPTIONS,
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "../../_constants/character";
import OfficialCharacterFormModal from "./OfficialCharacterFormModal";

const OfficialCharacterManager = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [visibility, setVisibility] = useState<CharacterVisibility | "">("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<number>();
  const [detailCharacterId, setDetailCharacterId] = useState<number | null>(
    null,
  );

  const { data, isLoading } = useOfficialCharacterListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    visibility,
  });
  const { createMutation, updateMutation } = useOfficialCharacterMutation();
  const { deleteMutation } = useCharacterMutation();

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingCharacterId(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (character: Character) => {
    setEditingCharacterId(character.characterId);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: OfficialCharacterSchema) => {
    if (editingCharacterId !== undefined) {
      updateMutation.mutate(
        { characterId: editingCharacterId, values },
        { onSuccess: () => setIsFormOpen(false) },
      );
      return;
    }

    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  const handleDelete = (character: Character) => {
    openConfirm({
      title: "공식 캐릭터를 삭제할까요?",
      description: `'${character.name}' 캐릭터가 앱에서 즉시 노출 중단됩니다.`,
      warning: "메인 노출 큐레이션에 사용 중이라면 함께 확인해 주세요.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync(character.characterId),
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
      key: "tags",
      header: "태그",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {row.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] bg-subtle px-1.5 py-0.5 text-[11px] text-font-2"
            >
              #{tag}
            </span>
          ))}
        </div>
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
      width: "96px",
      align: "center",
      render: (row) => (
        // 행 클릭(상세 모달)과 겹치지 않도록 액션 영역의 클릭은 여기서 멈춘다.
        <div
          className="flex items-center justify-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
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
      <Alert tone="info">
        공식 캐릭터는 크리에이터가 <b>PLAT공식</b>으로 고정되며, 메인 노출의
        &apos;공식 캐릭터 맛보기&apos; 후보가 됩니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="캐릭터명, 태그 검색"
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

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              공식 캐릭터 등록
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.characterId)}
          isLoading={isLoading}
          onRowClick={(row) => setDetailCharacterId(row.characterId)}
          emptyTitle="등록된 공식 캐릭터가 없습니다."
          emptyDescription="첫 공식 캐릭터를 등록해 메인 노출 후보로 만들어 보세요."
          emptyAction={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Crown size={15} />}
              onClick={handleOpenCreate}
            >
              공식 캐릭터 등록
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

      <OfficialCharacterFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        characterId={editingCharacterId}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <CharacterDetailModal
        characterId={detailCharacterId}
        onClose={() => setDetailCharacterId(null)}
      />
    </>
  );
};

export default OfficialCharacterManager;
