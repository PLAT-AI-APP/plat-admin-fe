"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminUniverseListQuery } from "@/api/universe/getAdminUniverseList";
import { formatDate } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatStatCount, formatWithCommas } from "@/lib/utils";
import type { AdminUniverseListItem } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../../../universes/_constants/character";
import UniverseStateBadge from "../../../universes/_components/UniverseStateBadge";
import UniverseTendencyDot, {
  UniverseTendencyLegend,
} from "../../../universes/_components/UniverseTendencyDot";
import { USER_DETAIL_PAGE_SIZE } from "./userDetailConstants";

interface UserUniversePanelProps {
  userId: string;
  nickname: string;
}

/**
 * 이 유저가 만든 세계관 목록. 행을 누르면 세계관 상세로 넘어간다.
 *
 * **크리에이터 ID가 아니라 유저 ID로 조회한다.** 두 ID는 따로 발급되는
 * Snowflake라 값이 다르고, 유저 화면이 들고 있는 것은 `userId`뿐이다.
 * 서버가 크리에이터를 한 번 거쳐 세계관을 찾아 준다(`userId` 필터).
 */
const UserUniversePanel = ({ userId, nickname }: UserUniversePanelProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUniverseListQuery({
    page,
    size: USER_DETAIL_PAGE_SIZE,
    userId,
  });

  const columns: TableColumn<AdminUniverseListItem>[] = [
    {
      key: "universe",
      header: "세계관",
      width: "300px",
      render: (row) => (
        <div className="flex items-center gap-3">
          {/* `UNIVERSE_PROFILE`에 SQ40은 없다(422). 목록용 가장 작은 규격이 SQ80이다. */}
          <EntityImage
            src={resolveImageUrl(
              row.profileImageUrl,
              row.profileImageFileId,
              "UNIVERSE_PROFILE",
              "SQ80",
            )}
            alt={row.title}
            ratio="square"
            fileId={row.profileImageFileId}
            className="w-11 shrink-0"
          />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <UniverseTendencyDot tendency={row.tendency} />
              <p className="title-5 truncate text-font-1">{row.title}</p>
            </div>
            <p className="body-6 mt-0.5 truncate text-font-2">
              {row.introduce}
            </p>
            <p className="caption-3 mt-0.5 text-font-disabled tabular-nums">
              #{row.universeId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "장르",
      align: "center",
      width: "90px",
      render: (row) => (
        <span className="body-5 text-font-2">
          {UNIVERSE_CATEGORY_LABEL[row.category]}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "공개 범위",
      align: "center",
      width: "90px",
      render: (row) => (
        <Badge tone={UNIVERSE_VISIBILITY_TONE[row.visibility]}>
          {UNIVERSE_VISIBILITY_LABEL[row.visibility]}
        </Badge>
      ),
    },
    {
      /* 세계관 목록과 같은 규칙으로 심사 · 상태를 한 칸에 담는다. */
      key: "state",
      header: "상태",
      align: "center",
      width: "90px",
      render: (row) => (
        <UniverseStateBadge
          status={row.status}
          reviewStatus={row.reviewStatus}
        />
      ),
    },
    {
      key: "scenarioCount",
      header: "시나리오",
      align: "right",
      numeric: true,
      width: "80px",
      render: (row) => formatWithCommas(row.scenarioCount),
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      width: "80px",
      // 지표성 숫자는 세계관 목록과 같은 축약 규칙을 쓴다.
      render: (row) => formatStatCount(row.chatCount),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      width: "80px",
      render: (row) => formatStatCount(row.likeCount),
    },
    {
      key: "createdAt",
      header: "생성일",
      align: "right",
      numeric: true,
      width: "110px",
      render: (row) => (
        <span className="body-5 text-font-2">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <Card
      title={`보유 세계관 ${formatWithCommas(data?.totalCount ?? 0)}건`}
      description="행을 클릭하면 세계관 상세로 이동합니다."
      noPadding
    >
      <UniverseTendencyLegend className="border-b border-border-main px-5 py-2.5" />

      <Table
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(row) => row.universeId}
        isLoading={isLoading}
        skeletonRows={4}
        onRowClick={(row) => router.push(`/universes/${row.universeId}`)}
        emptyTitle="등록한 세계관이 없습니다."
        emptyDescription={`'${nickname}' 유저가 만든 세계관이 아직 없습니다.`}
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

export default UserUniversePanel;
