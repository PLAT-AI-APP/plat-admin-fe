"use client";

import { useRouter } from "next/navigation";
import {
  useAdminUniverseListQuery,
  type AdminUniverseListParams,
  type UniverseOrder,
} from "@/api/universe/getAdminUniverseList";
import { useListParams } from "@/hooks/useListParams";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { AdminUniverseListItem } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  UNIVERSE_CATEGORY_FILTER_OPTIONS,
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_ORDER_OPTIONS,
  UNIVERSE_REVIEW_FILTER_OPTIONS,
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_STATUS_FILTER_OPTIONS,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_TENDENCY_LABEL,
  UNIVERSE_VISIBILITY_FILTER_OPTIONS,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../_constants/character";

/** 주소에 실리는 목록 조건. 전역 검색(⌘K)이 넘겨 주는 keyword도 여기로 들어온다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  order: "CREATED_DESC",
  category: "",
  visibility: "",
  status: "",
  reviewStatus: "",
};

/**
 * 세계관 관리 보드(실서버 plat-admin).
 *
 * 큐레이션 후보 피커·공식 패널이 쓰는 목업 목록(`useUniverseListQuery`)과 달리
 * 실서버 목록을 쓴다. 행을 누르면 같은 실 ID로 상세가 열린다.
 */
const UniverseBoard = () => {
  const router = useRouter();
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const order = params.order as UniverseOrder;
  const category = params.category as AdminUniverseListParams["category"];
  const visibility = params.visibility as AdminUniverseListParams["visibility"];
  const status = params.status as AdminUniverseListParams["status"];
  const reviewStatus =
    params.reviewStatus as AdminUniverseListParams["reviewStatus"];

  const { data, isLoading } = useAdminUniverseListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    order,
    category,
    visibility,
    status,
    reviewStatus,
  });

  const columns: TableColumn<AdminUniverseListItem>[] = [
    {
      key: "universe",
      header: "세계관",
      width: "300px",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-font-1">
            {row.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-font-2">
            {row.introduce}
          </p>
          <p className="mt-0.5 text-[11px] text-font-disabled tabular-nums">
            #{row.universeId}
          </p>
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
      key: "category",
      header: "장르",
      align: "center",
      render: (row) => (
        <span className="text-[13px] text-font-2">
          {UNIVERSE_CATEGORY_LABEL[row.category]} ·{" "}
          {UNIVERSE_TENDENCY_LABEL[row.tendency]}
        </span>
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
      key: "reviewStatus",
      header: "심사",
      align: "center",
      render: (row) => (
        <Badge tone={UNIVERSE_REVIEW_TONE[row.reviewStatus]}>
          {UNIVERSE_REVIEW_LABEL[row.reviewStatus]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => (
        <div className="flex flex-col items-center gap-0.5">
          <Badge tone={UNIVERSE_STATUS_TONE[row.status]}>
            {UNIVERSE_STATUS_LABEL[row.status]}
          </Badge>
          {/* 파기 전까지는 복구 문의를 받을 수 있으므로 남은 기한을 함께 보여 준다. */}
          {row.status === "DELETED" && row.purgeAt && (
            <span className="text-[11px] text-font-2 tabular-nums">
              {formatDate(row.purgeAt)} 파기
            </span>
          )}
        </div>
      ),
    },
    {
      key: "commentEnabled",
      header: "댓글",
      align: "center",
      render: (row) =>
        row.commentEnabled ? (
          <span className="text-[13px] text-font-2">사용</span>
        ) : (
          <span className="text-[13px] text-font-disabled">미사용</span>
        ),
    },
    {
      key: "scenarioCount",
      header: "시나리오",
      align: "right",
      numeric: true,
      render: (row) => `${formatWithCommas(row.scenarioCount)}편`,
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.chatCount),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      render: (row) => formatWithCommas(row.likeCount),
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
      <Alert tone="info" title="세계관은 캐릭터와 시나리오를 품는 단위입니다.">
        세계관 하나에 <b>캐릭터</b>가 등장하고, 유저는 세계관에 들어와{" "}
        <b>시나리오</b>를 골라 대화를 시작합니다. 행을 클릭하면 번역 · 에셋 ·
        시나리오를 함께 검수하고 심사 · 상태를 조치할 수 있습니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="세계관 제목, 소개 검색"
          />

          <div className="flex items-center gap-2">
            <Select
              options={UNIVERSE_CATEGORY_FILTER_OPTIONS}
              value={category}
              onChange={(event) => setParams({ category: event.target.value })}
              selectBoxClassName="w-32"
              aria-label="장르 필터"
            />
            <Select
              options={UNIVERSE_VISIBILITY_FILTER_OPTIONS}
              value={visibility}
              onChange={(event) =>
                setParams({ visibility: event.target.value })
              }
              selectBoxClassName="w-32"
              aria-label="공개 범위 필터"
            />
            <Select
              options={UNIVERSE_REVIEW_FILTER_OPTIONS}
              value={reviewStatus}
              onChange={(event) =>
                setParams({ reviewStatus: event.target.value })
              }
              selectBoxClassName="w-28"
              aria-label="심사 상태 필터"
            />
            <Select
              options={UNIVERSE_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => setParams({ status: event.target.value })}
              selectBoxClassName="w-28"
              aria-label="운영 상태 필터"
            />
            <Select
              options={UNIVERSE_ORDER_OPTIONS}
              value={order}
              onChange={(event) => setParams({ order: event.target.value })}
              selectBoxClassName="w-32"
              aria-label="정렬 기준"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => row.universeId}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/universes/${row.universeId}`)}
          emptyTitle="조건에 맞는 세계관이 없습니다."
          emptyDescription="검색어나 필터를 바꿔 보세요."
        />

        <Pagination
          page={page}
          totalCount={data?.totalCount ?? 0}
          pageSize={DEFAULT_PAGE_SIZE}
          onChange={(next) => setParams({ page: next })}
        />
      </Card>
    </>
  );
};

export default UniverseBoard;
