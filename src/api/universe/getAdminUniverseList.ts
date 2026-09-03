import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  AdminUniverseListItem,
  UniverseCategory,
  UniverseReviewStatus,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
} from "@/type/character";
import type { ServiceLanguage } from "@/type/language";

/**
 * 실서버(plat-admin) 세계관 목록.
 *
 * 세계관 관리 보드 · 공식 세계관 패널 · 메인 노출 후보 피커가 모두 이 목록을
 * 쓴다. **세계관 목록의 출처는 이 하나뿐이라**, 어느 화면에서 고른 세계관이든
 * 같은 실 ID로 상세까지 이어진다.
 */

/**
 * 정렬 기준. 서버 `UniverseOrderBy` enum과 값이 같아야 한다.
 *
 * `TITLE_ASC` · `TITLE_DESC`도 서버가 받기는 하지만, **번역 테이블 조인을 피하려고
 * 실제로는 ID로 정렬한다.** 값을 지우면 서버 enum과 어긋나므로 타입에는 남겨 두고,
 * 화면 정렬 목록에서만 뺀다(`UniverseBoard`의 `ORDER_OPTIONS` 주석 참고).
 */
export type UniverseOrder =
  | "CREATED_DESC"
  | "CREATED_ASC"
  | "CHAT_DESC"
  | "LIKE_DESC"
  | "TITLE_ASC"
  | "TITLE_DESC";

/** 서버가 실제로 받는 조건. 빈 문자열은 보내지 않는다(enum 파싱 실패 방지). */
export interface AdminUniverseFilterParams {
  category?: UniverseCategory | "";
  visibility?: UniverseVisibility | "";
  status?: UniverseStatus | "";
  reviewStatus?: UniverseReviewStatus | "";
  tendency?: UniverseTendency | "";
  commentEnabled?: "true" | "false" | "";
  /** 제작자 드릴다운. 상세 화면의 "제작자"가 이 값으로 링크를 건다. */
  creatorId?: string;
  /**
   * 유저가 만든 세계관만. 유저 상세의 "세계관" 탭이 쓴다.
   *
   * **`creatorId`와 다른 값이다.** 크리에이터 ID와 유저 ID는 따로 발급되는
   * Snowflake라 서로 바꿔 넣으면 오류 없이 빈 목록이 된다. 유저 화면이 들고 있는
   * 것은 `userId`뿐이므로 서버가 크리에이터를 한 번 거쳐 세계관을 찾는다.
   */
  userId?: string;
  /** 해시태그 드릴다운. 태그가 실제로 어디에 붙어 있는지 확인할 때 쓴다. */
  hashtagId?: string;
  /**
   * 공식 계정이 만든 세계관만.
   *
   * 세계관이 들고 있는 값이 아니라 **공식 계정 지정에서 계산되는 값**이라,
   * `false`를 보내도 "공식이 아닌 것만"이 되지 않고 조건 없음과 같다.
   * 공식 계정 화면이 지정 결과를 확인하는 데 쓴다.
   */
  officialOnly?: boolean;
  order?: UniverseOrder;
  language?: ServiceLanguage;
}

export interface AdminUniverseListParams extends AdminUniverseFilterParams {
  /** 화면은 1부터, 서버는 0부터 센다. 변환은 이 파일에서만 한다. */
  page: number;
  size: number;
  keyword?: string;
}

/** 서버 목록 한 줄. ID는 API 경계에서 문자열로 온다(Snowflake 규약). */
interface AdminUniverseItemResponse {
  id: string;
  title: string;
  introduce: string;
  category: UniverseCategory;
  tendency: UniverseTendency;
  visibility: UniverseVisibility;
  status: UniverseStatus;
  reviewStatus: UniverseReviewStatus;
  official: boolean;
  chatCount: number;
  likeCount: number;
  commentEnabled: boolean;
  creatorId: string;
  userId: string | null;
  nickname: string | null;
  profileImageFileId: string | null;
  profileImageUrl: string | null;
  hashtagCount: number;
  scenarioCount: number;
  translationCount: number;
  createdAt: string;
  updatedAt: string | null;
}

/** 서버 페이징 봉투(PageWith). 화면의 `PageResponse`로 정규화한다. */
interface PageWithResponse<T> {
  page: {
    number: number;
    size: number;
    numberOfElements: number;
    hasNext: boolean;
    totalElements: number;
    totalPages: number;
  };
  content: T[];
}

const toItem = (item: AdminUniverseItemResponse): AdminUniverseListItem => ({
  universeId: item.id,
  title: item.title,
  introduce: item.introduce,
  category: item.category,
  tendency: item.tendency,
  visibility: item.visibility,
  status: item.status,
  reviewStatus: item.reviewStatus,
  isOfficial: item.official,
  chatCount: item.chatCount,
  likeCount: item.likeCount,
  commentEnabled: item.commentEnabled,
  creatorId: item.creatorId,
  userId: item.userId,
  nickname: item.nickname ?? "-",
  profileImageFileId: item.profileImageFileId,
  profileImageUrl: item.profileImageUrl,
  hashtagCount: item.hashtagCount,
  scenarioCount: item.scenarioCount,
  translationCount: item.translationCount,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

/** 빈 문자열 필터는 아예 빼고, 페이지는 0부터로 낮춰 서버가 받는 형태로 만든다. */
const toRequestParams = (params: AdminUniverseListParams) => {
  const clean: Record<string, string | number> = {
    page: Math.max(params.page - 1, 0),
    size: params.size,
  };
  if (params.keyword?.trim()) clean.keyword = params.keyword.trim();
  if (params.category) clean.category = params.category;
  if (params.visibility) clean.visibility = params.visibility;
  if (params.status) clean.status = params.status;
  if (params.reviewStatus) clean.reviewStatus = params.reviewStatus;
  if (params.tendency) clean.tendency = params.tendency;
  if (params.commentEnabled) clean.commentEnabled = params.commentEnabled;
  if (params.creatorId) clean.creatorId = params.creatorId;
  if (params.userId) clean.userId = params.userId;
  if (params.hashtagId) clean.hashtagId = params.hashtagId;
  if (params.officialOnly) clean.officialOnly = "true";
  if (params.order) clean.order = params.order;
  if (params.language) clean.language = params.language;
  return clean;
};

export const getAdminUniverseList = async (
  params: AdminUniverseListParams,
): Promise<PageResponse<AdminUniverseListItem>> => {
  const response = await liveAxios.get<
    PageWithResponse<AdminUniverseItemResponse>
  >("/admin/universes", { params: toRequestParams(params) });

  const { page, content } = response.data;

  return {
    content: content.map(toItem),
    // 화면은 1부터 센다. 서버의 0-based 번호를 되돌린다.
    page: page.number + 1,
    size: page.size,
    totalCount: page.totalElements,
    totalPages: page.totalPages,
  };
};

export const useAdminUniverseListQuery = (params: AdminUniverseListParams) => {
  return useQuery<PageResponse<AdminUniverseListItem>, AppError>({
    queryKey: ["get-universe-list", params],
    queryFn: () => getAdminUniverseList(params),
  });
};

/** 탭 숫자의 기본 신선도. 목록 기본값(5분)보다 길게 잡는다. */
const COUNT_STALE_TIME = 1000 * 60 * 30;

/**
 * 조건에 걸리는 세계관이 몇 건인지만.
 *
 * 목록과 같은 엔드포인트를 쓰지만 쓰임이 다르다. 목록은 지금 보고 있는 화면이라
 * 자주 최신이어야 하고, 이 숫자는 탭에 붙는 참고값이라 **몇 분 사이에 뒤집히지
 * 않는다.** 탭을 옮길 때마다, 창을 다시 볼 때마다 다시 세면 목록 한 번 여는 데
 * 조회가 여러 번 나간다. 그래서 오래 묵혀 두고 쓴다.
 *
 * 화면에 걸린 검색 · 필터는 넘기지 않는다. 필터를 만질 때마다 숫자가 흔들리면
 * "지금 몇 건 남았나"를 읽을 수 없다.
 *
 * 다만 **운영자가 방금 줄인 숫자**는 예외라, 그런 조건은 `staleTime`을 짧게
 * 넘겨 쓴다(심사 대기 등).
 */
export const useAdminUniverseCountQuery = (
  filter: AdminUniverseFilterParams,
  staleTime: number = COUNT_STALE_TIME,
) => {
  // 개수만 필요하므로 한 건만 받는다. 키를 목록과 같은 모양으로 두어 캐시를 나눈다.
  const params: AdminUniverseListParams = { page: 1, size: 1, ...filter };

  return useQuery<PageResponse<AdminUniverseListItem>, AppError, number>({
    queryKey: ["get-universe-list", params],
    queryFn: () => getAdminUniverseList(params),
    select: (page) => page.totalCount,
    staleTime,
    refetchOnWindowFocus: false,
  });
};
