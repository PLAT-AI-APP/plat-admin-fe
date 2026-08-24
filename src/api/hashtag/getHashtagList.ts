import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Hashtag, HashtagCategory, HashtagSort } from "@/type/hashtag";

/** 서버가 실제로 받는 조건. 검색어·페이지는 여기에 없다. */
export interface HashtagFilterParams {
  category?: HashtagCategory | "";
  /** 노출 여부. "true" | "false" | "" (전체) */
  isActive?: string;
  /** 성인 태그 여부. "true" | "false" | "" (전체) */
  isAdult?: string;
  sort?: HashtagSort;
}

export interface HashtagListParams extends HashtagFilterParams {
  page: number;
  size: number;
  keyword?: string;
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
  sort: filters.sort || undefined,
});

/**
 * 서버는 검색어를 받지 않으므로 받아 온 목록에서 직접 걸러낸다.
 * 목록에는 한국어 라벨만 오기 때문에 검색 대상도 한국어 라벨과 ID뿐이다.
 */
const filterByKeyword = (hashtags: Hashtag[], keyword?: string) => {
  const trimmed = keyword?.trim().toLowerCase();

  if (!trimmed) return hashtags;

  return hashtags.filter(
    (hashtag) =>
      hashtag.name.toLowerCase().includes(trimmed) ||
      String(hashtag.hashtagId) === trimmed,
  );
};

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
 * 서버가 검색어·페이징을 지원하지 않아 두 가지는 받아 온 뒤 화면에서 처리합니다.
 * 캐시는 **서버에 실제로 보내는 조건**으로만 잡으므로 검색어를 고치거나 페이지를
 * 넘겨도 다시 요청하지 않습니다.
 */
export const useHashtagListQuery = ({
  page,
  size,
  keyword,
  ...filters
}: HashtagListParams) => {
  return useQuery<Hashtag[], AppError, PageResponse<Hashtag>>({
    queryKey: ["get-hashtag-list", filters],
    queryFn: () => getHashtagList(filters),
    select: (hashtags) => paginate(filterByKeyword(hashtags, keyword), page, size),
  });
};
