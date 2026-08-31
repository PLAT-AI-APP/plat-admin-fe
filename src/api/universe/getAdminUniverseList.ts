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
 * 실서버(plat-admin) 세계관 목록. 세계관 관리 보드와 공식 세계관 패널이 쓴다.
 *
 * 큐레이션 후보 목록(`useUniverseListQuery`, 목업)과 **의도적으로 분리**한다.
 * 후보 피커는 아직 목업이라, 실서버로 옮긴 화면끼리 보드 → 상세가 같은 실
 * ID로 이어지게 한다.
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
  /** 크리에이터 드릴다운. 상세 화면의 "소유 계정"이 이 값으로 링크를 건다. */
  creatorId?: string;
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
  chatCount: number;
  likeCount: number;
  commentEnabled: boolean;
  creatorId: string;
  creatorNickname: string | null;
  profileImageFileId: string | null;
  profileImageUrl: string | null;
  hashtagCount: number;
  scenarioCount: number;
  translationCount: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
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
  chatCount: item.chatCount,
  likeCount: item.likeCount,
  commentEnabled: item.commentEnabled,
  creatorId: item.creatorId,
  creatorNickname: item.creatorNickname ?? "-",
  profileImageFileId: item.profileImageFileId,
  profileImageUrl: item.profileImageUrl,
  hashtagCount: item.hashtagCount,
  scenarioCount: item.scenarioCount,
  translationCount: item.translationCount,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  deletedAt: item.deletedAt,
  purgeAt: item.purgeAt,
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
