"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminUniverseListQuery } from "@/api/universe/getAdminUniverseList";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { AdminUniverseListItem } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityImage from "@/components/ui/EntityImage";
import Pagination from "@/components/ui/Pagination";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../../_constants/character";

/**
 * 지금 공식으로 표시되는 세계관 목록.
 *
 * **읽기 전용이다.** 여기서 뺄 수 있는 것은 없다. 공식 여부는 계정 지정에서
 * 계산되므로, 목록을 바꾸려면 위에서 계정을 등록·해제한다.
 * 계정 등록 결과가 실제로 무엇에 반영됐는지 같은 화면에서 확인하기 위한 표다.
 *
 * 상태로 거르지 않는다 — 위 표의 "공식 세계관" 건수와 같은 조건이라야 두 숫자가
 * 어긋나지 않는다. 삭제 대기 중인 세계관도 여기 보인다.
 */
const OfficialUniversePanel = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUniverseListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    officialOnly: true,
    order: "CHAT_DESC",
  });

  const columns: TableColumn<AdminUniverseListItem>[] = [
    {
      key: "universe",
      header: "세계관",
      width: "260px",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
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
            className="w-10 shrink-0"
          />

          <div className="min-w-0">
            <p className="truncate body-4 font-medium text-font-1">
              {row.title}
            </p>
            <p className="mt-0.5 body-6 text-font-2 tabular-nums">
              #{row.universeId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      header: "소유 계정",
      render: (row) => (
        <span className="body-5 text-font-2">{row.creatorNickname}</span>
      ),
    },
    {
      key: "visibility",
      header: "공개 범위",
      align: "center",
      render: (row) => (
        <Badge tone={UNIVERSE_VISIBILITY_TONE[row.visibility]}>
          {UNIVERSE_VISIBILITY_LABEL[row.visibility]}
        </Badge>
      ),
    },
    {
      key: "review",
      header: "심사",
      align: "center",
      render: (row) => (
        <Badge tone={UNIVERSE_REVIEW_TONE[row.reviewStatus]}>
          {UNIVERSE_REVIEW_LABEL[row.reviewStatus]}
        </Badge>
      ),
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.chatCount),
    },
  ];

  return (
    <Card
      title="공식으로 표시되는 세계관"
      description="계정 지정에서 계산된 결과입니다. 세계관 하나만 따로 빼거나 넣을 수 없습니다."
      noPadding
    >
      <Table
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(row) => row.universeId}
        isLoading={isLoading}
        skeletonRows={5}
        onRowClick={(row) => router.push(`/universes/${row.universeId}`)}
        emptyTitle="공식으로 표시되는 세계관이 없습니다."
        emptyDescription="공식 계정을 등록하거나, 등록한 계정이 세계관을 만들면 여기에 나타납니다."
      />

      <Pagination
        page={page}
        totalCount={data?.totalCount ?? 0}
        pageSize={DEFAULT_PAGE_SIZE}
        onChange={setPage}
      />
    </Card>
  );
};

export default OfficialUniversePanel;
