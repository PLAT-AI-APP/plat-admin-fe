"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useListParams } from "@/hooks/useListParams";
import {
  useCharacterListQuery,
  type CharacterSort,
} from "@/api/character/getCharacterList";
import { useCharacterMutation } from "@/api/character/mutateCharacter";
import type { CsvColumn } from "@/lib/csv";
import { formatDate } from "@/lib/dayjs";
import { formatStatCount, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type {
  Character,
  CharacterStatus,
  CharacterVisibility,
} from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
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
import {
  CHARACTER_SORT_OPTIONS,
  CHARACTER_STATUS_FILTER_OPTIONS,
  CHARACTER_STATUS_LABEL,
  CHARACTER_STATUS_TONE,
  DEFAULT_CHARACTER_SORT,
} from "../_constants/characterOptions";
import CharacterBlockModal from "./CharacterBlockModal";
import CharacterCell from "./CharacterCell";
import { buildCharacterActions } from "./characterActions";

/**
 * CSV 컬럼은 표와 같은 순서로 두어 내려받은 파일이 화면과 일치하게 한다.
 *
 * 지표는 축약하지 않고 원래 숫자를 쓴다. 표에서는 "1.2천"이 읽기 좋지만
 * CSV는 그대로 집계에 들어가므로 축약하면 계산이 불가능해진다.
 */
const CHARACTER_CSV_COLUMNS: CsvColumn<Character>[] = [
  { header: "캐릭터 ID", value: (row) => row.characterId },
  { header: "이름", value: (row) => row.name },
  { header: "크리에이터 ID", value: (row) => row.creatorId },
  { header: "크리에이터", value: (row) => row.creatorNickname },
  { header: "공식 여부", value: (row) => (row.isOfficial ? "Y" : "N") },
  { header: "노출 상태", value: (row) => VISIBILITY_LABEL[row.visibility] },
  { header: "운영 상태", value: (row) => CHARACTER_STATUS_LABEL[row.status] },
  { header: "NSFW", value: (row) => (row.isNsfw ? "Y" : "N") },
  { header: "태그", value: (row) => row.tags.join(" ") },
  { header: "등장 세계관", value: (row) => row.universeCount },
  { header: "에셋", value: (row) => row.assetCount },
  { header: "대화", value: (row) => row.chatCount },
  { header: "좋아요", value: (row) => row.likeCount },
  { header: "생성일", value: (row) => formatDate(row.createdAt) },
];

/** 주소에 실리는 목록 조건. 전역 검색(⌘K)이 넘겨 주는 keyword도 여기로 들어온다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  visibility: "",
  status: "",
  isOfficial: "",
  sort: DEFAULT_CHARACTER_SORT as string,
  /** 유저 상세에서 "이 크리에이터의 캐릭터"로 넘어올 때 실린다. */
  creatorId: "",
};

const CharacterManager = () => {
  const router = useRouter();
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, isOfficial, creatorId } = params;
  const visibility = params.visibility as CharacterVisibility | "";
  const status = params.status as Exclude<CharacterStatus, "DELETED"> | "";
  const sort = params.sort as CharacterSort;

  const [blockTarget, setBlockTarget] = useState<Character | null>(null);

  const { data, isLoading, isError } = useCharacterListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    visibility,
    status,
    isOfficial,
    sort,
    // Snowflake ID 라 숫자로 바꾸지 않는다. 빈 문자열만 걸러 보낸다.
    creatorId: creatorId || undefined,
  });
  const { visibilityMutation, statusMutation, deleteMutation } =
    useCharacterMutation();

  const rows = data?.content ?? [];

  /*
    크리에이터 필터가 걸렸을 때 보여 줄 이름.
    조회된 행에서 가져온다 — 필터가 걸린 목록의 행은 모두 같은 크리에이터다.
  */
  const filteredCreatorName = creatorId
    ? (rows[0]?.creatorNickname ?? `#${creatorId}`)
    : "";

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

  /** 사유를 받은 뒤 실행 직전에 한 번 더 확인한다. (유저 계정 정지와 같은 흐름) */
  const handleBlock = (reason: string) => {
    if (!blockTarget) return;

    openConfirm({
      title: "캐릭터를 차단할까요?",
      description: `'${blockTarget.name}' 캐릭터가 앱에서 즉시 내려가고 노출 상태가 숨김으로 바뀝니다.`,
      warning: "차단을 해제해도 노출 상태는 자동으로 복구되지 않습니다.",
      confirmText: "차단",
      tone: "danger",
      onConfirm: () =>
        statusMutation
          .mutateAsync({
            characterId: blockTarget.characterId,
            body: { status: "BLOCKED", reason },
          })
          .then(() => setBlockTarget(null)),
    });
  };

  const handleUnblock = (character: Character) => {
    openConfirm({
      title: "차단을 해제할까요?",
      description: `'${character.name}' 캐릭터가 정상 상태로 돌아갑니다. 노출 상태는 숨김으로 남으므로 필요하면 따로 공개로 바꿔 주세요.`,
      confirmText: "차단 해제",
      onConfirm: () =>
        statusMutation.mutateAsync({
          characterId: character.characterId,
          body: { status: "ACTIVE" },
        }),
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
        <span className="body-5 text-font-2">{row.creatorNickname}</span>
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
      /*
        운영 상태를 노출 상태와 나란히 둔다. 둘 다 "앱에서 안 보임"이라는
        결과를 만들지만, 되돌리는 방법이 달라 한 화면에서 구분되어야 한다.
      */
      key: "status",
      header: "운영 상태",
      align: "center",
      render: (row) => (
        <Badge tone={CHARACTER_STATUS_TONE[row.status]}>
          {CHARACTER_STATUS_LABEL[row.status]}
        </Badge>
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
      /*
        대화 · 좋아요는 서비스 화면에 찍히는 값과 같은 규칙으로 축약한다.
        운영자가 앱에서 본 숫자와 그대로 대조할 수 있어야 한다.
      */
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      render: (row) => (
        <span title={formatWithCommas(row.chatCount)}>
          {formatStatCount(row.chatCount)}
        </span>
      ),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      render: (row) => (
        <span title={formatWithCommas(row.likeCount)}>
          {formatStatCount(row.likeCount)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "생성일",
      align: "right",
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
              onBlock: () => setBlockTarget(row),
              onUnblock: () => handleUnblock(row),
              onDelete: () => handleDelete(row),
            })}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {/*
        이 화면이 목업이라는 사실을 먼저 알린다. 서버에는 관리자 캐릭터 API가
        없고(`CharacterController`는 빈 껍데기), 캐릭터는 세계관에 매핑된 하위
        엔티티로 운영된다. 이걸 모르면 여기서 한 조치가 앱에 반영된 줄 안다.
      */}
      <Alert tone="info" title="아직 서버와 연동되지 않은 화면입니다.">
        캐릭터는 서버에서 독립 도메인이 아니라 세계관에 매핑된 하위 정보입니다.
        이 화면의 조회 · 조치는 모두 목업이며 앱에 반영되지 않습니다. 실제
        운영은 세계관 화면에서 하세요.
      </Alert>

      {/* 크리에이터 필터는 유저 상세에서 넘어올 때만 걸린다. 해제 경로를 함께 둔다. */}
      {creatorId && (
        <Alert
          tone="info"
          title={`'${filteredCreatorName}' 크리에이터의 캐릭터만 보고 있습니다.`}
          action={
            <button
              type="button"
              onClick={() => setParams({ creatorId: "" })}
              className="title-6 shrink-0 underline"
            >
              전체 보기
            </button>
          }
        />
      )}

      {/*
        실패를 빈 목록으로 위장하지 않는다. "조건에 맞는 캐릭터가 없습니다"가
        뜨면 운영자는 필터를 의심하며 시간을 쓴다.
      */}
      {isError && (
        <Alert tone="danger" title="캐릭터 목록을 불러오지 못했습니다.">
          잠시 후 검색 조건을 다시 적용해 주세요. 계속 실패하면 관제 채널에
          공유해 주세요.
        </Alert>
      )}

      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="캐릭터명, 크리에이터, 태그 검색"
          />

          <div className="flex flex-wrap items-center gap-2">
            <CsvExportButton
              fileName="캐릭터목록"
              rows={rows}
              columns={CHARACTER_CSV_COLUMNS}
              disabled={isLoading}
            />

            <Select
              options={CHARACTER_SORT_OPTIONS}
              value={sort}
              onChange={(event) => {
                setParams({ sort: event.target.value });
              }}
              selectBoxClassName="w-44"
              aria-label="정렬 기준"
            />

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
              options={CHARACTER_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => {
                setParams({ status: event.target.value });
              }}
              selectBoxClassName="w-40"
              aria-label="운영 상태 필터"
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
          rows={rows}
          getRowKey={(row) => String(row.characterId)}
          isLoading={isLoading}
          onRowClick={(row) =>
            router.push(`/universes/characters/${row.characterId}`)
          }
          emptyTitle={
            isError
              ? "목록을 불러오지 못했습니다."
              : "조건에 맞는 캐릭터가 없습니다."
          }
          emptyDescription={
            isError
              ? "위 안내를 확인한 뒤 다시 시도해 주세요."
              : "검색어를 지우거나 필터를 전체로 바꿔 보세요."
          }
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      <CharacterBlockModal
        characterName={blockTarget?.name ?? null}
        onClose={() => setBlockTarget(null)}
        onSubmit={handleBlock}
        isSubmitting={statusMutation.isPending}
      />
    </>
  );
};

export default CharacterManager;
