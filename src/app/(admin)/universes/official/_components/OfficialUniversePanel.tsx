"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUniverseListQuery } from "@/api/universe/getUniverseList";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Universe } from "@/type/character";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
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
 */
const OfficialUniversePanel = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUniverseListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    officialOnly: true,
    sort: "CHAT_COUNT",
  });

  const columns: TableColumn<Universe>[] = [
    {
      key: "universe",
      header: "세계관",
      width: "260px",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[8px] bg-subtle">
            <Image
              src={row.thumbnailUrl}
              alt={row.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-font-1">
              {row.name}
            </p>
            <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
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
        <span className="text-[13px] text-font-2">{row.creatorNickname}</span>
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
        getRowKey={(row) => String(row.universeId)}
        isLoading={isLoading}
        skeletonRows={5}
        onRowClick={(row) =>
          router.push(`/universes/${row.universeId}`)
        }
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
