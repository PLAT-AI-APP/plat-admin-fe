import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import { IS_MOCKING } from "@/api/baseUri";
import type { AppError } from "@/type/api";

export type GlobalSearchType =
  | "USER"
  | "CHARACTER"
  | "UNIVERSE"
  | "HASHTAG";

export interface GlobalSearchItem {
  type: GlobalSearchType;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  id: string;
  /** 대표 이름 */
  title: string;
  /** 보조 설명 (이메일, 캐릭터명 등) */
  description: string;
  /** 선택 시 이동할 경로 */
  href: string;
}

export interface GlobalSearchResponse {
  items: GlobalSearchItem[];
}

export const getGlobalSearch = async (keyword: string) => {
  const response = await adminAxios.get<GlobalSearchResponse>("/admin/search", {
    params: { keyword },
  });

  return response.data;
};

/**
 * 전역 검색(⌘K)에서 사용하는 통합 조회입니다.
 * 유저·캐릭터·세계관·해시태그를 한 번에 찾습니다.
 *
 * **실서버에 통합 검색 엔드포인트가 없어 목업이 켜진 환경에서만 부릅니다.**
 * 목업이 꺼진 운영(`main`)에서는 메뉴 검색만 동작합니다.
 */
export const useGlobalSearchQuery = (keyword: string) => {
  const trimmed = keyword.trim();

  return useQuery<GlobalSearchResponse, AppError>({
    queryKey: ["get-global-search", trimmed],
    queryFn: () => getGlobalSearch(trimmed),
    // 두 글자 미만은 결과가 너무 많아 의미가 없다.
    enabled: IS_MOCKING && trimmed.length >= 2,
    staleTime: 1000 * 30,
  });
};
