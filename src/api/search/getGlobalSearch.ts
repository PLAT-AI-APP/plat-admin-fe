import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import { hasPermission, type PermissionKey } from "@/type/permission";

/**
 * 결과 종류. 실서버는 USER · UNIVERSE · PAYMENT_ORDER 만 준다.
 * CHARACTER · HASHTAG 는 목업이 아직 내는 값이라 화면이 깨지지 않게 남겨 둔다.
 */
export type GlobalSearchType =
  | "USER"
  | "UNIVERSE"
  | "PAYMENT_ORDER"
  | "CHARACTER"
  | "HASHTAG";

/** 서버 응답 한 줄. 이동 경로는 서버가 주지 않고 화면이 종류로 만든다. */
export interface GlobalSearchResponseItem {
  type: GlobalSearchType;
  /** Snowflake. 문자열 그대로 다룬다 — 이유는 `User.userId`에 있다. */
  id: string;
  /** 대표 이름 */
  title: string;
  /** 보조 설명 (이메일, 주문번호 등). 없을 수 있다. */
  description: string | null;
}

export interface GlobalSearchItem extends GlobalSearchResponseItem {
  /** 선택 시 이동할 경로 */
  href: string;
}

export interface GlobalSearchResponse {
  items: GlobalSearchItem[];
}

/** 종류별 이동 경로. 종류가 늘면 여기만 고친다. */
const hrefOf = ({ type, id, title }: GlobalSearchResponseItem): string => {
  switch (type) {
    case "USER":
      return `/users/${id}`;
    case "UNIVERSE":
      return `/universes/${id}`;
    case "PAYMENT_ORDER":
      return `/billing/payments/${id}`;
    case "CHARACTER":
      return `/universes/characters/${id}`;
    case "HASHTAG":
      return `/universes/hashtags?keyword=${encodeURIComponent(title.replace(/^#/, ""))}`;
  }
};

export const getGlobalSearch = async (
  keyword: string,
): Promise<GlobalSearchResponse> => {
  const response = await liveAxios.get<{ items: GlobalSearchResponseItem[] }>(
    "/search",
    { params: { keyword } },
  );

  return {
    items: (response.data.items ?? []).map((item) => ({
      ...item,
      href: hrefOf(item),
    })),
  };
};

/** 하나라도 있으면 통합 검색을 부른다. 서버는 권한 없는 종류를 빼고 준다. */
const SEARCH_PERMISSIONS: PermissionKey[] = [
  "user:read",
  "universe:read",
  "payment:read",
];

/**
 * 전역 검색(⌘K)에서 사용하는 통합 조회입니다.
 * 유저 · 세계관 · 결제 주문을 한 번에 찾습니다. 두 글자 미만은 서버가 400 으로 막아 부르지 않습니다.
 */
export const useGlobalSearchQuery = (keyword: string) => {
  const trimmed = keyword.trim();
  const canSearch = useAdminStore((state) =>
    SEARCH_PERMISSIONS.some((permission) =>
      hasPermission(
        state.admin?.permissions,
        permission,
        state.admin?.isSuperAdmin,
      ),
    ),
  );

  return useQuery<GlobalSearchResponse, AppError>({
    queryKey: ["get-global-search", trimmed],
    queryFn: () => getGlobalSearch(trimmed),
    enabled: canSearch && trimmed.length >= 2,
    staleTime: 1000 * 30,
  });
};
