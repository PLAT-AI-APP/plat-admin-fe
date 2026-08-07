"use client";

import Image from "next/image";
import { useState } from "react";
import {
  useScenarioListQuery,
  type ScenarioListParams,
} from "@/api/scenario/getScenarioList";
import { useKeywordParam } from "@/hooks/useKeywordParam";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { Scenario } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import { SCENARIO_SORT_OPTIONS } from "../../_constants/character";
import ScenarioDetailModal from "./ScenarioDetailModal";

type ScenarioSort = NonNullable<ScenarioListParams["sort"]>;

const ScenarioBoard = () => {
  const [page, setPage] = useState(1);
  // 전역 검색(⌘K)에서 넘어온 검색어를 초기값으로 쓰고, 화면에서 검색하면 그 값이 우선한다.
  const keywordParam = useKeywordParam();
  const [draftKeyword, setDraftKeyword] = useState<string | null>(null);
  const keyword = draftKeyword ?? keywordParam;
  const setKeyword = setDraftKeyword;
  const [sort, setSort] = useState<ScenarioSort>("RECENT");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [detailScenario, setDetailScenario] = useState<Scenario | null>(null);

  // 메인 노출 큐레이션과 같은 훅을 쓴다. 후보 목록과 화면이 항상 같은 데이터를 본다.
  const { data, isLoading } = useScenarioListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    sort,
    officialOnly,
  });

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const columns: TableColumn<Scenario>[] = [
    {
      key: "scenario",
      header: "세계관",
      width: "280px",
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
              #{row.scenarioId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "characterName",
      header: "캐릭터",
      render: (row) => (
        <span className="text-[13px] text-font-2">{row.characterName}</span>
      ),
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
  ];

  return (
    <>
      <Alert tone="info" title="메인 노출 큐레이션의 후보 목록입니다.">
        배너 · 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천은 모두 이 목록에서
        세계관을 선택합니다. 에셋 추천 후보를 고를 때는 정렬을 &apos;에셋
        많은순&apos;으로 바꿔 보세요.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={handleSearch}
            placeholder="세계관 ID, 제목, 캐릭터명, 태그 검색"
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-font-2">공식만 보기</span>
              <Switch
                label="공식 세계관만 보기"
                checked={officialOnly}
                onChange={(checked) => {
                  setOfficialOnly(checked);
                  setPage(1);
                }}
              />
            </div>

            <Select
              options={SCENARIO_SORT_OPTIONS}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ScenarioSort);
                setPage(1);
              }}
              selectBoxClassName="w-40"
              aria-label="정렬 기준"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.scenarioId)}
          isLoading={isLoading}
          onRowClick={setDetailScenario}
          emptyTitle="조건에 맞는 세계관이 없습니다."
          emptyDescription="검색어를 지우거나 '공식만 보기'를 꺼 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={setPage}
        />
      </Card>

      <ScenarioDetailModal
        scenario={detailScenario}
        onClose={() => setDetailScenario(null)}
      />
    </>
  );
};

export default ScenarioBoard;
