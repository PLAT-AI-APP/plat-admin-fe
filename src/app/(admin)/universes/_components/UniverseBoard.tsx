"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useUniverseListQuery,
  type UniverseListParams,
} from "@/api/universe/getUniverseList";
import { useListParams } from "@/hooks/useListParams";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import { mainCharacterOf, type Universe } from "@/type/character";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  UNIVERSE_REVIEW_FILTER_OPTIONS,
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_SORT_OPTIONS,
  UNIVERSE_STATUS_FILTER_OPTIONS,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../_constants/character";

type UniverseSort = NonNullable<UniverseListParams["sort"]>;

/** 주소에 실리는 목록 조건. 전역 검색(⌘K)이 넘겨 주는 keyword도 여기로 들어온다. */
const DEFAULT_PARAMS = {
  page: 1,
  keyword: "",
  sort: "RECENT",
  officialOnly: "",
  status: "",
  reviewStatus: "",
};

const UniverseBoard = () => {
  const router = useRouter();
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword } = params;
  const sort = params.sort as UniverseSort;
  const officialOnly = params.officialOnly === "true";
  const status = params.status as NonNullable<UniverseListParams["status"]>;
  const reviewStatus = params.reviewStatus as NonNullable<
    UniverseListParams["reviewStatus"]
  >;

  // 메인 노출 큐레이션과 같은 훅을 쓴다. 후보 목록과 화면이 항상 같은 데이터를 본다.
  const { data, isLoading } = useUniverseListQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    keyword,
    sort,
    officialOnly,
    status,
    reviewStatus,
  });

  const columns: TableColumn<Universe>[] = [
    {
      key: "universe",
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
              #{row.universeId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "characters",
      header: "캐릭터",
      render: (row) => (
        /* 같은 캐릭터가 여러 세계관에 나올 수 있어 목록에서는 대표 한 명만 적는다. */
        <span className="text-[13px] text-font-2">
          {mainCharacterOf(row)?.name ?? "-"}
          {row.characters.length > 1 && (
            <span className="text-font-disabled">
              {" "}
              외 {row.characters.length - 1}명
            </span>
          )}
        </span>
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
  ];

  return (
    <>
      <Alert tone="info" title="세계관은 캐릭터와 시나리오를 품는 단위입니다.">
        세계관 하나에 <b>캐릭터</b>가 여러 명 등장할 수 있고, 같은 캐릭터가 다른
        세계관에도 나올 수 있습니다. 유저는 세계관에 들어와 <b>시나리오</b>를 골라
        대화를 시작합니다. 행을 클릭하면 캐릭터와 시나리오를 함께 볼 수 있습니다.
      </Alert>

      <Alert tone="info" title="메인 노출 큐레이션의 후보 목록입니다.">
        배너 · 오늘의 PICK · 공식 캐릭터 맛보기 · 에셋 추천은 모두 이 목록에서
        세계관을 선택합니다. 앱 홈에는 <b>승인 · 공개 상태인 세계관만</b> 실리므로
        심사 대기나 비공개 세계관을 고르면 자리만 비게 됩니다. 공식 여부는 세계관이
        아니라 <b>소유 계정</b>에 붙습니다(공식 계정 화면에서 지정).
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="세계관 ID, 제목, 캐릭터명, 태그 검색"
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-font-2">공식만 보기</span>
              <Switch
                label="공식 세계관만 보기"
                checked={officialOnly}
                onChange={(checked) =>
                  setParams({ officialOnly: checked ? "true" : "" })
                }
              />
            </div>

            <Select
              options={UNIVERSE_REVIEW_FILTER_OPTIONS}
              value={reviewStatus}
              onChange={(event) =>
                setParams({ reviewStatus: event.target.value })
              }
              selectBoxClassName="w-36"
              aria-label="심사 상태 필터"
            />

            <Select
              options={UNIVERSE_STATUS_FILTER_OPTIONS}
              value={status}
              onChange={(event) => setParams({ status: event.target.value })}
              selectBoxClassName="w-36"
              aria-label="운영 상태 필터"
            />

            <Select
              options={UNIVERSE_SORT_OPTIONS}
              value={sort}
              onChange={(event) => setParams({ sort: event.target.value })}
              selectBoxClassName="w-36"
              aria-label="정렬 기준"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={data?.content ?? []}
          getRowKey={(row) => String(row.universeId)}
          isLoading={isLoading}
          onRowClick={(row) =>
            router.push(`/universes/${row.universeId}`)
          }
          emptyTitle="조건에 맞는 세계관이 없습니다."
          emptyDescription="검색어를 지우거나 '공식만 보기'를 꺼 보세요."
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
