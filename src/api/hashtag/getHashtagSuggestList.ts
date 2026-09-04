import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { HashtagSuggestGroup, HashtagSuggestSort } from "@/type/hashtag";

export interface HashtagSuggestListParams {
  /** 화면은 1부터, 서버는 0부터 센다. 변환은 이 파일에서만 한다. */
  page: number;
  size: number;
  /** 태그 이름과 제안 이유를 함께 훑는다. */
  keyword?: string;
  /** 이미 등록된 태그인지. "true" | "false" | "" (전체) */
  registered?: string;
  sort?: HashtagSuggestSort;
}

/** 서버 목록 한 줄. ID는 API 경계에서 문자열로 온다(Snowflake 규약). */
interface HashtagSuggestGroupResponse {
  key: string;
  name: string;
  suggestCount: number;
  suggesterCount: number;
  firstSuggestedAt: string;
  lastSuggestedAt: string;
  registeredHashtagId: string | null;
}

const toGroup = (item: HashtagSuggestGroupResponse): HashtagSuggestGroup => ({
  key: item.key,
  name: item.name,
  suggestCount: item.suggestCount,
  suggesterCount: item.suggesterCount,
  firstSuggestedAt: item.firstSuggestedAt,
  lastSuggestedAt: item.lastSuggestedAt,
  registeredHashtagId: item.registeredHashtagId,
});

/** 빈 문자열 필터는 아예 빼고, 페이지는 0부터로 낮춰 서버가 받는 형태로 만든다. */
const toRequestParams = (params: HashtagSuggestListParams) => ({
  page: params.page - 1,
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  registered: params.registered || undefined,
  sort: params.sort || undefined,
});

export const getHashtagSuggestList = async (
  params: HashtagSuggestListParams,
): Promise<PageResponse<HashtagSuggestGroup>> => {
  const response = await liveAxios.get<PageWith<HashtagSuggestGroupResponse>>(
    "/admin/hashtags/suggestions",
    { params: toRequestParams(params) },
  );

  const page = toPageResponse(response.data);

  return { ...page, content: page.content.map(toGroup) };
};

/**
 * 사용자가 보낸 해시태그 제안을 **같은 태그끼리 묶어** 조회합니다.
 *
 * 승인·반려가 없는 자료라 이 목록은 처리 대기열이 아니라 수요 지표입니다.
 * 총 개수(`totalCount`)도 제안 건수가 아니라 **묶음 수**입니다.
 */
export const useHashtagSuggestListQuery = (params: HashtagSuggestListParams) => {
  return useQuery<PageResponse<HashtagSuggestGroup>, AppError>({
    queryKey: ["get-hashtag-suggest-list", params],
    queryFn: () => getHashtagSuggestList(params),
  });
};
