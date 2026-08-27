import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Hashtag, HashtagCategory, HashtagSort } from "@/type/hashtag";

/** 서버가 실제로 받는 조건. 페이지만 여기에 없다. */
export interface HashtagFilterParams {
  category?: HashtagCategory | "";
  /** 노출 여부. "true" | "false" | "" (전체) */
  isActive?: string;
  /** 성인 태그 여부. "true" | "false" | "" (전체) */
  isAdult?: string;
  /** 검색어. 서버가 언어별 라벨 전체와 ID를 훑는다. */
  keyword?: string;
  sort?: HashtagSort;
}

export interface HashtagListParams extends HashtagFilterParams {
  page: number;
  size: number;
}

/** 서버 목록 항목. ID는 API 경계에서 문자열로 온다(Snowflake 규약). */
interface HashtagItemResponse {
  id: string;
  /** 한국어 라벨. 목록에는 다른 언어 번역이 오지 않는다. */
  name: string;
  category: HashtagCategory;
  translationCount: number;
  totalTranslationCount: number;
  usingCount: number;
  createdAt: string;
  isAdult: boolean;
  isEnabled: boolean;
}

interface HashtagListResponse {
  hashtags: HashtagItemResponse[];
}

const toHashtag = (item: HashtagItemResponse): Hashtag => ({
  hashtagId: Number(item.id),
  name: item.name,
  category: item.category,
  translationCount: item.translationCount,
  totalTranslationCount: item.totalTranslationCount,
  usageCount: item.usingCount,
  isAdult: item.isAdult,
  isActive: item.isEnabled,
  createdAt: item.createdAt,
});

/** 빈 문자열(전체)은 아예 보내지 않는다. 보내면 서버가 enum 파싱에 실패한다. */
const toRequestParams = (filters: HashtagFilterParams) => ({
  category: filters.category || undefined,
  isEnabled: filters.isActive || undefined,
  isAdult: filters.isAdult || undefined,
  keyword: filters.keyword?.trim() || undefined,
  sort: filters.sort || undefined,
});

/** 서버가 조건에 맞는 전체를 한 번에 주므로 페이지 분할도 화면에서 한다. */
const paginate = (
  hashtags: Hashtag[],
  page: number,
  size: number,
): PageResponse<Hashtag> => {
  const start = (page - 1) * size;

  return {
    content: hashtags.slice(start, start + size),
    page,
    size,
    totalCount: hashtags.length,
    totalPages: Math.max(1, Math.ceil(hashtags.length / size)),
  };
};

/** 조건에 맞는 해시태그 전체. 페이징이 없는 목록 API다. */
export const getHashtagList = async (
  filters: HashtagFilterParams,
): Promise<Hashtag[]> => {
  const response = await liveAxios.get<HashtagListResponse>("/admin/hashtags", {
    params: toRequestParams(filters),
  });

  return response.data.hashtags.map(toHashtag);
};

/**
 * 관리자가 등록해 둔 해시태그 목록을 조회합니다. 사용자는 이 목록에서만 태그를 고를 수 있습니다.
 *
 * 검색은 서버가 합니다. 목록 응답에는 한국어 라벨만 실려서 화면에서 거르면
 * **번역만 아는 태그를 찾을 수 없기** 때문입니다. 페이징만 서버에 없어 받아 온
 * 뒤 화면에서 자릅니다 — 캐시 키에 페이지를 넣지 않으므로 페이지를 넘겨도
 * 다시 요청하지 않습니다.
 */
export const useHashtagListQuery = ({
  page,
  size,
  ...filters
}: HashtagListParams) => {
  return useQuery<Hashtag[], AppError, PageResponse<Hashtag>>({
    queryKey: ["get-hashtag-list", filters],
    queryFn: () => getHashtagList(filters),
    select: (hashtags) => paginate(hashtags, page, size),
  });
};
