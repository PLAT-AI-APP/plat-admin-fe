import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { HashtagSuggest } from "@/type/hashtag";

export interface HashtagSuggestItemListParams {
  /** 묶음 목록이 준 `key`. 대표 표기를 보내도 서버가 같은 규칙으로 눕혀 찾는다. */
  name: string;
  page: number;
  size: number;
}

interface HashtagSuggestItemResponse {
  id: string;
  name: string;
  content: string;
  userId: string;
  nickname: string | null;
  createdAt: string;
}

const toSuggest = (item: HashtagSuggestItemResponse): HashtagSuggest => ({
  suggestId: item.id,
  name: item.name,
  content: item.content,
  userId: item.userId,
  nickname: item.nickname,
  createdAt: item.createdAt,
});

export const getHashtagSuggestItemList = async (
  params: HashtagSuggestItemListParams,
): Promise<PageResponse<HashtagSuggest>> => {
  const response = await liveAxios.get<PageWith<HashtagSuggestItemResponse>>(
    "/admin/hashtags/suggestions/items",
    {
      params: {
        name: params.name,
        page: params.page - 1,
        size: params.size,
      },
    },
  );

  const page = toPageResponse(response.data);

  return { ...page, content: page.content.map(toSuggest) };
};

/**
 * 묶음 하나에 들어온 제안 원문을 조회합니다. 같은 태그라도 원하는 이유가 달라
 * 지표(건수)만으로는 무엇을 만들지 정할 수 없어 원문을 따로 봅니다.
 *
 * `name`이 없으면(모달이 닫힌 상태) 요청하지 않습니다.
 */
export const useHashtagSuggestItemListQuery = ({
  name,
  page,
  size,
}: {
  name: string | null;
  page: number;
  size: number;
}) => {
  return useQuery<PageResponse<HashtagSuggest>, AppError>({
    queryKey: ["get-hashtag-suggest-items", name, page, size],
    queryFn: () => getHashtagSuggestItemList({ name: name ?? "", page, size }),
    enabled: Boolean(name),
  });
};
