"use client";

import { useRouter } from "next/navigation";
import {
  useAdminUniverseListQuery,
  type AdminUniverseListParams,
  type UniverseOrder,
} from "@/api/universe/getAdminUniverseList";
import { useListParams } from "@/hooks/useListParams";
import { ExternalLink, Eye, Refresh, Search, Users, Warning } from "@/icons";
import type { CsvColumn } from "@/lib/csv";
import { formatDate } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatStatCount, formatWithCommas } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/type/api";
import type { AdminUniverseListItem } from "@/type/character";
import { SERVICE_LANGUAGES } from "@/type/language";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CsvExportButton from "@/components/ui/CsvExportButton";
import Dropdown, { type DropdownItem } from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Select, { type SelectOption } from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
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
  tendency: "",
  commentEnabled: "",
  /*
    드릴다운 수신용. 세계관 상세의 "제작자"가 `/universes?creatorId=...`로
    링크를 걸고, 해시태그 화면에서도 `hashtagId`로 사용처를 보러 온다.
    여기에 기본값이 없으면 주소에 값이 실려 와도 훅이 읽어 주지 않아 죽은 링크가 된다.
  */
  creatorId: "",
  hashtagId: "",
};

/*
  정렬 목록에서 `TITLE_ASC` · `TITLE_DESC`를 뺀다.

  서버는 이 두 값을 받기는 하지만 번역 테이블 조인을 피하려고 **실제로는 ID로
  정렬한다.** "제목 오름차순"이라고 적어 두면 화면이 거짓말을 하게 되고,
  운영자가 "제목순인데 왜 이 순서냐"를 확인하는 데 시간을 쓴다. 라벨을
  "등록순(제목 정렬 미지원)"으로 고쳐 남기는 방법도 있지만, 그러면 CREATED_ASC와
  결과가 같은 항목이 둘 더 생길 뿐이라 목록에서 아예 뺀다.
  서버가 제목 정렬을 제대로 구현하면 이 filter만 지우면 된다.
*/
const ORDER_OPTIONS = UNIVERSE_ORDER_OPTIONS.filter(
  (option) => !option.value.startsWith("TITLE_"),
);

const isSupportedOrder = (value: string): value is UniverseOrder =>
  ORDER_OPTIONS.some((option) => option.value === value);

/*
  성향 필터.

  `_constants/character.ts`는 세계관 도메인 화면이 함께 쓰는 파일이라 보드 전용
  옵션은 여기에 둔다. 라벨은 공용 상수를 그대로 쓰되 `ALL`만 바꾼다 —
  `UNIVERSE_TENDENCY_LABEL.ALL`이 "전체"라서 "성향 전체"(= 필터 없음)와 나란히
  놓으면 둘을 구분할 수 없다.
*/
const TENDENCY_FILTER_OPTIONS: SelectOption[] = [
  { label: "성향 전체", value: "" },
  { label: "성향 무관", value: "ALL" },
  { label: UNIVERSE_TENDENCY_LABEL.MALE_ORIENTED, value: "MALE_ORIENTED" },
  { label: UNIVERSE_TENDENCY_LABEL.FEMALE_ORIENTED, value: "FEMALE_ORIENTED" },
];

/** 댓글 허용 여부. 서버는 Boolean 쿼리로 받으므로 문자열 "true"/"false"를 보낸다. */
const COMMENT_FILTER_OPTIONS: SelectOption[] = [
  { label: "댓글 전체", value: "" },
  { label: "댓글 허용", value: "true" },
  { label: "댓글 불가", value: "false" },
];

/* ------------------------------------------------------------------ */
/* 업무 흐름 탭                                                          */
/* ------------------------------------------------------------------ */

type BoardTab = "ALL" | "REVIEW" | "ACTIVE";

/** 탭 프리셋 어디에도 없는 조합. 탭 목록에 없으므로 아무 탭도 켜지지 않는다. */
type BoardTabValue = BoardTab | "CUSTOM";

/** 탭이 정하는 것은 상태 · 심사 두 축뿐이다. 나머지 필터는 탭과 무관하게 유지된다. */
const TAB_FILTERS: Record<BoardTab, { status: string; reviewStatus: string }> =
  {
    ALL: { status: "", reviewStatus: "" },
    REVIEW: { status: "", reviewStatus: "PENDING" },
    ACTIVE: { status: "ACTIVE", reviewStatus: "" },
  };

/**
 * 현재 조건이 어느 탭인지 되짚는다.
 *
 * 탭 전용 파라미터를 따로 두지 않고 `status` · `reviewStatus`에서 되짚는 이유는,
 * 주소가 조건의 원본이어야 하기 때문이다. 탭 파라미터를 따로 두면 상세에서
 * 넘어온 주소나 필터 Select로 만든 조합과 탭이 어긋난다.
 *
 * 어느 탭에도 해당하지 않는 조합(예: 심사 반려, 비활성)이면 `CUSTOM`이다.
 * 이때는 **아무 탭도 켜지지 않는다** — 없는 탭을 켜 두는 것보다 정직하다.
 */
const resolveTab = (status: string, reviewStatus: string): BoardTabValue => {
  const entries = Object.entries(TAB_FILTERS) as [
    BoardTab,
    { status: string; reviewStatus: string },
  ][];

  const found = entries.find(
    ([, filter]) =>
      filter.status === status && filter.reviewStatus === reviewStatus,
  );

  return found?.[0] ?? "CUSTOM";
};

/** 서비스 언어 수. 번역이 이 수에 못 미치면 아직 다 번역되지 않은 세계관이다. */
const TOTAL_LANGUAGE_COUNT = SERVICE_LANGUAGES.length;

/**
 * 세계관 관리 보드(실서버 plat-admin).
 *
 * 큐레이션 후보 피커·공식 패널이 쓰는 목업 목록(`useUniverseListQuery`)과 달리
 * 실서버 목록을 쓴다. 행을 누르면 같은 실 ID로 상세가 열린다.
 */
const UniverseBoard = () => {
  const router = useRouter();
  const [params, setParams] = useListParams(DEFAULT_PARAMS);
  const { page, keyword, creatorId, hashtagId } = params;
  const order = isSupportedOrder(params.order) ? params.order : "CREATED_DESC";
  const category = params.category as AdminUniverseListParams["category"];
  const visibility = params.visibility as AdminUniverseListParams["visibility"];
  const status = params.status as AdminUniverseListParams["status"];
  const reviewStatus =
    params.reviewStatus as AdminUniverseListParams["reviewStatus"];
  const tendency = params.tendency as AdminUniverseListParams["tendency"];
  const commentEnabled =
    params.commentEnabled as AdminUniverseListParams["commentEnabled"];

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminUniverseListQuery({
      page,
      size: DEFAULT_PAGE_SIZE,
      keyword,
      order,
      category,
      visibility,
      status,
      reviewStatus,
      tendency,
      commentEnabled,
      creatorId,
      hashtagId,
    });

  /*
    심사 대기 건수는 다른 필터와 무관한 "밀린 일의 양"이라 조건 없이 따로 센다.
    개수만 필요하므로 한 건만 받아 totalCount를 읽는다.
  */
  const { data: pendingData } = useAdminUniverseListQuery({
    page: 1,
    size: 1,
    reviewStatus: "PENDING",
  });

  const rows = data?.content ?? [];
  const activeTab = resolveTab(params.status, params.reviewStatus);

  const tabs: TabItem<BoardTabValue>[] = [
    { label: "전체", value: "ALL" },
    { label: "심사 대기", value: "REVIEW", count: pendingData?.totalCount },
    { label: "운영 중", value: "ACTIVE" },
  ];

  const clearDrilldown = () => setParams({ creatorId: "", hashtagId: "" });

  const openDetail = (universeId: string) =>
    router.push(`/universes/${universeId}`);

  /*
    제작자를 누르면 그 사람의 유저 상세로 간다.

    링크는 `userId`로만 건다 — 크리에이터 ID와 유저 ID는 서로 다른
    Snowflake라 `creatorId`로 유저를 찾으면 반드시 빈 화면이 된다. 크리에이터에
    연결된 유저가 없으면(값이 null) 갈 곳이 없으므로 링크를 걸지 않는다.
  */
  const openUser = (userId: string) => router.push(`/users/${userId}`);

  /** 행 액션. 행 클릭(상세 이동)과 겹치지 않도록 셀에서 클릭을 멈춘다. */
  const buildRowActions = (row: AdminUniverseListItem): DropdownItem[] => [
    {
      label: "상세 보기",
      icon: <Eye size={15} />,
      onSelect: () => openDetail(row.universeId),
    },
    {
      label: "이 제작자의 세계관",
      icon: <Users size={15} />,
      onSelect: () => setParams({ creatorId: row.creatorId }),
    },
    {
      label: "제작자 유저 상세",
      icon: <Search size={15} />,
      disabled: !row.userId,
      onSelect: () => row.userId && openUser(row.userId),
    },
    {
      label: "새 탭에서 열기",
      icon: <ExternalLink size={15} />,
      onSelect: () =>
        window.open(
          `/universes/${row.universeId}`,
          "_blank",
          "noopener,noreferrer",
        ),
    },
  ];

  const columns: TableColumn<AdminUniverseListItem>[] = [
    {
      key: "universe",
      header: "세계관",
      width: "320px",
      render: (row) => (
        <div className="flex items-center gap-3">
          {/*
            썸네일이 있어야 목록에서 세계관을 눈으로 구분할 수 있다.
            `UNIVERSE_PROFILE`에 SQ40은 없다(422). 목록용 가장 작은 규격이 SQ80이다.
          */}
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
            <p className="title-5 truncate text-font-1">{row.title}</p>
            <p className="body-6 mt-0.5 truncate text-font-2">{row.introduce}</p>
            <p className="caption-3 mt-0.5 text-font-disabled tabular-nums">
              #{row.universeId}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      header: "제작자",
      render: (row) => {
        const userId = row.userId;

        return (
          /*
            제작자를 누르면 유저 상세로 간다. 행 클릭(세계관 상세)과 목적지가
            다르므로 셀에서 클릭을 멈춘다.
          */
          <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
            {userId ? (
              <button
                type="button"
                className="max-w-full truncate body-5 text-font-2 underline-offset-2 hover:text-font-1 hover:underline"
                onClick={() => openUser(userId)}
              >
                {row.nickname}
              </button>
            ) : (
              /* 연결된 유저가 없으면 갈 곳이 없다. 죽은 링크를 두지 않는다. */
              <p className="max-w-full truncate body-5 text-font-2">
                {row.nickname}
              </p>
            )}
            <p className="caption-3 mt-0.5 text-font-disabled tabular-nums">
              #{row.creatorId}
            </p>
          </div>
        );
      },
    },
    {
      /* 세계관 하나는 장르를 하나만 가진다. 한 칸에 하나만 적는다. */
      key: "category",
      header: "장르",
      align: "center",
      render: (row) => (
        <span className="body-5 text-font-2">
          {UNIVERSE_CATEGORY_LABEL[row.category]}
        </span>
      ),
    },
    {
      key: "tendency",
      header: "성향",
      align: "center",
      render: (row) => (
        <span className="body-5 text-font-2">
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
        <Badge tone={UNIVERSE_STATUS_TONE[row.status]}>
          {UNIVERSE_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "commentEnabled",
      header: "댓글",
      align: "center",
      render: (row) =>
        row.commentEnabled ? (
          <span className="body-5 text-font-2">허용</span>
        ) : (
          <span className="body-5 text-font-disabled">불가</span>
        ),
    },
    {
      key: "translationCount",
      header: "번역",
      align: "center",
      render: (row) => (
        // 6개 언어가 다 차지 않은 세계관은 앱에서 한국어로 대체 노출된다.
        <span
          className={
            row.translationCount >= TOTAL_LANGUAGE_COUNT
              ? "body-5 text-font-2 tabular-nums"
              : "body-5 text-warning tabular-nums"
          }
          title="번역이 없는 언어는 앱에서 한국어로 대체됩니다."
        >
          {row.translationCount}/{TOTAL_LANGUAGE_COUNT}
        </span>
      ),
    },
    {
      key: "chatCount",
      header: "대화",
      align: "right",
      numeric: true,
      // 지표성 숫자는 서비스 화면과 같은 축약 규칙을 쓴다.
      render: (row) => formatStatCount(row.chatCount),
    },
    {
      key: "likeCount",
      header: "좋아요",
      align: "right",
      numeric: true,
      render: (row) => formatStatCount(row.likeCount),
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
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Dropdown items={buildRowActions(row)} />
        </div>
      ),
    },
  ];

  /** CSV 컬럼은 표와 같은 순서로 둔다. 내려받은 파일이 화면과 어긋나지 않게 한다. */
  const csvColumns: CsvColumn<AdminUniverseListItem>[] = [
    { header: "ID", value: (row) => row.universeId },
    { header: "제목", value: (row) => row.title },
    { header: "소개", value: (row) => row.introduce },
    { header: "제작자", value: (row) => row.nickname },
    { header: "제작자 ID", value: (row) => row.creatorId },
    { header: "장르", value: (row) => UNIVERSE_CATEGORY_LABEL[row.category] },
    { header: "성향", value: (row) => UNIVERSE_TENDENCY_LABEL[row.tendency] },
    {
      header: "공개 범위",
      value: (row) => UNIVERSE_VISIBILITY_LABEL[row.visibility],
    },
    { header: "심사", value: (row) => UNIVERSE_REVIEW_LABEL[row.reviewStatus] },
    { header: "상태", value: (row) => UNIVERSE_STATUS_LABEL[row.status] },
    { header: "댓글", value: (row) => (row.commentEnabled ? "허용" : "불가") },
    {
      header: "번역",
      value: (row) => `${row.translationCount}/${TOTAL_LANGUAGE_COUNT}`,
    },
    // CSV는 원본 숫자를 담는다. 축약값을 담으면 스프레드시트에서 합계를 못 낸다.
    { header: "대화 수", value: (row) => row.chatCount },
    { header: "좋아요 수", value: (row) => row.likeCount },
    { header: "생성일", value: (row) => formatDate(row.createdAt) },
  ];

  return (
    <>
      <Alert tone="info" title="세계관은 캐릭터와 시나리오를 품는 단위입니다.">
        세계관 하나에 <b>캐릭터</b>가 등장하고, 유저는 세계관에 들어와{" "}
        <b>시나리오</b>를 골라 대화를 시작합니다. 행을 클릭하면 번역 · 에셋 ·
        시나리오를 함께 검수하고 심사 · 상태를 조치할 수 있습니다.
      </Alert>

      {/* 다른 화면에서 넘어온 드릴다운. 걸려 있는 줄 모르면 "세계관이 몇 개 없다"고 오해한다. */}
      {(creatorId || hashtagId) && (
        <Alert
          tone="warning"
          title="일부 세계관만 보고 있습니다."
          action={
            <Button variant="secondary" size="sm" onClick={clearDrilldown}>
              전체 보기
            </Button>
          }
        >
          {creatorId && <>제작자 #{creatorId}의 세계관</>}
          {creatorId && hashtagId && " · "}
          {hashtagId && <>해시태그 #{hashtagId}가 붙은 세계관</>}
          만 조회하는 중입니다.
        </Alert>
      )}

      <Card
        title={`세계관 ${formatWithCommas(data?.totalCount ?? 0)}건`}
        description="행을 클릭하면 상세 검수 화면이 열립니다."
        action={
          <CsvExportButton
            fileName="세계관"
            rows={rows}
            columns={csvColumns}
            disabled={isLoading || isError}
          />
        }
        noPadding
      >
        {/*
          업무 흐름 탭. 탭이 정하는 것은 상태 · 심사뿐이고, 어느 탭에도 없는
          조합(심사 반려 · 비활성)을 필터로 만들면 아무 탭도 켜지지 않는다.
        */}
        <Tabs
          items={tabs}
          value={activeTab}
          onChange={(tab) => {
            // 목록에 없는 값이라 눌릴 일이 없지만, 타입을 좁혀 프리셋만 적용한다.
            if (tab === "CUSTOM") return;

            setParams(TAB_FILTERS[tab]);
          }}
          className="px-2"
        />

        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={(next) => setParams({ keyword: next })}
            placeholder="세계관 제목, 소개 검색"
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              options={UNIVERSE_CATEGORY_FILTER_OPTIONS}
              value={category}
              onChange={(event) => setParams({ category: event.target.value })}
              selectBoxClassName="w-32"
              aria-label="장르 필터"
            />
            <Select
              options={TENDENCY_FILTER_OPTIONS}
              value={tendency}
              onChange={(event) => setParams({ tendency: event.target.value })}
              selectBoxClassName="w-28"
              aria-label="성향 필터"
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
              options={COMMENT_FILTER_OPTIONS}
              value={commentEnabled}
              onChange={(event) =>
                setParams({ commentEnabled: event.target.value })
              }
              selectBoxClassName="w-28"
              aria-label="댓글 허용 필터"
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
              options={ORDER_OPTIONS}
              value={order}
              onChange={(event) => setParams({ order: event.target.value })}
              selectBoxClassName="w-32"
              aria-label="정렬 기준"
            />
          </div>
        </div>

        {/*
          조회 실패를 빈 목록으로 보여 주면 "조건에 맞는 세계관이 없다"로 읽혀
          운영자가 필터만 계속 바꾸게 된다. 실패는 실패라고 말한다.
        */}
        {isError ? (
          <EmptyState
            icon={<Warning size={22} />}
            title="세계관 목록을 불러오지 못했습니다."
            description={
              error?.message ??
              "네트워크 또는 서버 오류입니다. 잠시 후 다시 시도해 주세요."
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Refresh size={15} />}
                isLoading={isFetching}
                onClick={() => refetch()}
              >
                다시 시도
              </Button>
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.universeId}
              isLoading={isLoading}
              onRowClick={(row) => openDetail(row.universeId)}
              emptyTitle="조건에 맞는 세계관이 없습니다."
              emptyDescription="검색어나 필터를 바꿔 보세요."
            />

            <Pagination
              page={page}
              totalCount={data?.totalCount ?? 0}
              pageSize={DEFAULT_PAGE_SIZE}
              onChange={(next) => setParams({ page: next })}
            />
          </>
        )}
      </Card>
    </>
  );
};

export default UniverseBoard;
