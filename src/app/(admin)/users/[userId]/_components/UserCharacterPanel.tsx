"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCharacterListQuery } from "@/api/character/getCharacterList";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { Character } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import CharacterCell from "../../../universes/characters/_components/CharacterCell";
import {
  VISIBILITY_LABEL,
  VISIBILITY_TONE,
} from "../../../universes/_constants/character";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserCharacterPanelProps {
  userId: number;
  nickname: string;
}

/** 이 유저가 크리에이터로 만든 캐릭터 목록. 행을 누르면 캐릭터 상세로 넘어간다. */
const UserCharacterPanel = ({ userId, nickname }: UserCharacterPanelProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCharacterListQuery({
    page,
    size: USER_DETAIL_PAGE_SIZE,
    creatorId: userId,
  });

  const columns: TableColumn<Character>[] = [
    {
      key: "character",
      header: "캐릭터",
      width: "220px",
      render: (row) => <CharacterCell character={row} />,
    },
    {
      key: "official",
      header: "공식 여부",
      align: "center",
      width: "100px",
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
      width: "100px",
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
      width: "80px",
      render: (row) =>
        row.isNsfw ? (
          <Badge tone="danger">NSFW</Badge>
        ) : (
          <span className="body-5 text-font-disabled">-</span>
        ),
    },
    {
      key: "universeCount",
      header: "등장 세계관",
      align: "right",
      numeric: true,
      width: "80px",
      render: (row) => formatWithCommas(row.universeCount),
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      width: "90px",
      render: (row) => formatWithCommas(row.chatCount),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      width: "90px",
      render: (row) => formatWithCommas(row.likeCount),
    },
    {
      key: "createdAt",
      header: "생성일",
      align: "right",
      numeric: true,
      width: "110px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card
      title={`보유 캐릭터 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="행을 클릭하면 캐릭터 상세로 이동합니다."
      noPadding
    >
      <Table
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(row) => String(row.characterId)}
        isLoading={isLoading}
        skeletonRows={4}
        onRowClick={(row) => router.push(`/universes/characters/${row.characterId}`)}
        emptyTitle="등록한 캐릭터가 없습니다."
        emptyDescription={`'${nickname}' 유저가 만든 캐릭터가 아직 없습니다.`}
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={USER_DETAIL_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default UserCharacterPanel;
