"use client";

import { useState } from "react";
import { useListParams } from "@/hooks/useListParams";
import { useHashtagSuggestListQuery } from "@/api/hashtag/getHashtagSuggestList";
import type { CsvColumn } from "@/lib/csv";
import { formatDate, formatDateTime } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { HashtagSuggestGroup, HashtagSuggestSort } from "@/type/hashtag";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import HashtagSuggestDetailModal from "./HashtagSuggestDetailModal";
import {
  HASHTAG_SUGGEST_REGISTERED_OPTIONS,
  HASHTAG_SUGGEST_SORT_OPTIONS,
} from "./hashtagSuggestOptions";
import { HASHTAG_TAB_DEFAULT_PARAMS } from "./hashtagTabs";

/** CSV는 표와 같은 순서로 둔다. 제안 원문은 묶음당 여러 건이라 여기 담지 않는다. */
const SUGGEST_CSV_COLUMNS: CsvColumn<HashtagSuggestGroup>[] = [
  { header: "제안 태그", value: (row) => row.name },
  { header: "요청 수", value: (row) => row.suggestCount },
  { header: "제안자 수", value: (row) => row.suggesterCount },
  { header: "등록 여부", value: (row) => (row.registeredHashtagId ? "등록됨" : "미등록") },
  { header: "첫 제안", value: (row) => formatDate(row.firstSuggestedAt) },
  { header: "최근 제안", value: (row) => formatDate(row.lastSuggestedAt) },
];

/** 주소에 실리는 목록 조건. 탭이 함께 실려야 새로고침해도 이 탭에 남는다. */
const DEFAULT_PARAMS = {
  ...HASHTAG_TAB_DEFAULT_PARAMS,
  page: 1,
  keyword: "",
  registered: "",
  sort: "COUNT_DESC",
};

/**
 * 해시태그 제안 목록.
 *
 * 제안은 **처리하는 자료가 아니다.** 승인·반려 상태를 두지 않고, 운영은 여기서
 * "무엇을 얼마나 원하나"만 읽은 뒤 필요하면 태그 탭에서 직접 등록한다.
 * 그래서 표의 한 줄은 제안 한 건이 아니라 태그 하나다.
 */
const HashtagSuggestManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, registered } = params;
  const sort = params.sort as HashtagSuggestSort;

  /**
   * 상세를 연 묶음의 키.
   *
   * 행 자체가 아니라 키를 들고 목록에서 다시 찾는다. 그래야 목록이 갱신될 때
   * 모달이 옛 숫자를 계속 보여 주지 않고, 묶음이 사라지면 모달도 닫힌다.
   */
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const { data, isLoading } = useHashtagSuggestListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    registered,
    sort,
  });

  const groups = data?.content ?? [];
  const detailGroup = groups.find((group) => group.key === detailKey) ?? null;

  /* 요청 수 막대의 기준. 페이지 안에서 가장 많이 요청된 태그를 100%로 둔다. */
  const topCount = groups.reduce(
    (max, group) => Math.max(max, group.suggestCount),
    0,
  );

  const columns: TableColumn<HashtagSuggestGroup>[] = [
    {
      key: "name",
      header: "제안 태그",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-font-1">#{row.name}</span>
          {row.registeredHashtagId && <Badge tone="success">등록됨</Badge>}
        </div>
      ),
    },
    {
      key: "suggestCount",
      header: "요청 수",
      width: "180px",
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* 숫자만 두면 3건과 300건이 같은 무게로 읽힌다. 막대로 쏠린 곳을 먼저 보이게 한다. */}
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-brand"
              style={{
                width: `${topCount === 0 ? 0 : (row.suggestCount / topCount) * 100}%`,
              }}
            />
          </div>
          <span className="tabular-nums text-font-1">
            {formatWithCommas(row.suggestCount)}
          </span>
        </div>
      ),
    },
    {
      key: "suggesterCount",
      header: "제안자",
      align: "right",
      numeric: true,
      render: (row) => (
        <span title="같은 사람이 여러 번 보낼 수 있어 요청 수와 다릅니다.">
          {formatWithCommas(row.suggesterCount)}명
        </span>
      ),
    },
    {
      key: "lastSuggestedAt",
      header: "최근 제안",
      render: (row) => (
        <span className="text-font-2" title={formatDateTime(row.lastSuggestedAt)}>
          {formatDate(row.lastSuggestedAt)}
        </span>
      ),
    },
    {
      key: "firstSuggestedAt",
      header: "첫 제안",
      render: (row) => (
        <span className="text-font-2">{formatDate(row.firstSuggestedAt)}</span>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="제안은 처리하는 자료가 아닙니다.">
        사용자가 캐릭터·세계관을 만들다가 &lsquo;없는 태그&rsquo;를 적어 보낸
        기록입니다. 승인·반려 절차가 없으니 어떤 태그를 얼마나 원하는지만 읽고,
        필요하면 <b>해시태그 관리</b> 탭에서 직접 등록해 주세요. 표기가 달라도
        (<code>#판타지</code> · <code>판타지</code>) 같은 태그로 묶어 셉니다.
      </Alert>

      <Card
        title={`제안된 태그 ${formatWithCommas(data?.totalCount ?? 0)}종`}
        description="요청이 몰린 태그부터 봅니다. 한 줄을 누르면 제안 이유를 읽을 수 있습니다."
        action={
          <CsvExportButton
            fileName="해시태그 제안"
            rows={groups}
            columns={SUGGEST_CSV_COLUMNS}
            disabled={isLoading}
          />
        }
        noPadding
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="태그 이름 · 제안 이유 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              aria-label="등록 여부 필터"
              options={HASHTAG_SUGGEST_REGISTERED_OPTIONS}
              value={registered}
              onChange={(event) => setParams({ registered: event.target.value })}
              selectBoxClassName="w-36"
            />

            <Select
              aria-label="정렬"
              options={HASHTAG_SUGGEST_SORT_OPTIONS}
              value={sort}
              onChange={(event) => setParams({ sort: event.target.value })}
              selectBoxClassName="w-36"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={groups}
          getRowKey={(row) => row.key}
          isLoading={isLoading}
          onRowClick={(row) => setDetailKey(row.key)}
          emptyTitle="들어온 제안이 없습니다."
          emptyDescription="사용자가 캐릭터를 만들다 태그를 제안하면 여기에 쌓입니다."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>

      {/* 묶음이 바뀌면 새로 그린다. 안 그러면 3페이지를 보던 상태가 다음 묶음에 그대로 남는다. */}
      <HashtagSuggestDetailModal
        key={detailKey ?? "closed"}
        group={detailGroup}
        onClose={() => setDetailKey(null)}
      />
    </>
  );
};

export default HashtagSuggestManager;
