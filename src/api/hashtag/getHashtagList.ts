import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Hashtag, HashtagCategory } from "@/type/hashtag";

export interface HashtagListParams {
  page: number;
  size: number;
  keyword?: string;
  category?: HashtagCategory | "";
  /** 노출 여부. "true" | "false" | "" (전체) */
  isActive?: string;
  /** 성인 태그 여부. "true" | "false" | "" (전체) */
  isAdult?: string;
  sort?: "RECENT" | "USAGE" | "LABEL";
}

export const getHashtagList = async (params: HashtagListParams) => {
  const response = await adminAxios.get<PageResponse<Hashtag>>(
    "/admin/hashtags",
    { params },
  );

  return response.data;
};

/** 관리자가 등록해 둔 해시태그 목록을 조회합니다. 사용자는 이 목록에서만 태그를 고를 수 있습니다. */
export const useHashtagListQuery = (params: HashtagListParams) => {
  return useQuery<PageResponse<Hashtag>, AppError>({
    queryKey: ["get-hashtag-list", params],
    queryFn: () => getHashtagList(params),
  });
};
