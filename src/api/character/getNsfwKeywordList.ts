import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { NsfwKeyword, NsfwKeywordLevel } from "@/type/character";

export interface NsfwKeywordListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 모든 레벨을 조회한다. */
  level?: NsfwKeywordLevel | "";
}

export const getNsfwKeywordList = async (params: NsfwKeywordListParams) => {
  const response = await adminAxios.get<PageResponse<NsfwKeyword>>(
    "/admin/nsfw-keywords",
    { params },
  );

  return response.data;
};

/** NSFW 키워드 화면에서 검색·레벨 필터와 함께 사용합니다. */
export const useNsfwKeywordListQuery = (params: NsfwKeywordListParams) => {
  return useQuery<PageResponse<NsfwKeyword>, AppError>({
    queryKey: ["get-nsfw-keyword-list", params],
    queryFn: () => getNsfwKeywordList(params),
  });
};
