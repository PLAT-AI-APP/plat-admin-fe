import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  Character,
  CharacterStatus,
  CharacterVisibility,
} from "@/type/character";

/**
 * 캐릭터 목록 정렬 기준.
 *
 * 값 이름은 세계관 실목록(`UniverseOrderBy`)과 맞춰 둔다. 서버에 캐릭터
 * 전용 API가 생길 때 같은 이름을 그대로 보낼 수 있어야 한다.
 */
export type CharacterSort =
  | "CREATED_DESC"
  | "CREATED_ASC"
  | "CHAT_DESC"
  | "LIKE_DESC"
  | "UNIVERSE_DESC"
  | "NAME_ASC";

export interface CharacterListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 모든 노출 상태를 조회한다. */
  visibility?: CharacterVisibility | "";
  /**
   * 운영 상태. 빈 문자열이면 전체다.
   *
   * 노출 상태(`visibility`)와 다른 축이다. 차단은 운영자가 내린 조치이고
   * 숨김은 크리에이터도 바꿀 수 있는 값이라, 두 필터를 하나로 합치면
   * "운영이 막은 것"과 "크리에이터가 내린 것"을 구분할 수 없다.
   * `DELETED`는 목록에서 제외되므로 필터 값으로 쓰지 않는다.
   */
  status?: Exclude<CharacterStatus, "DELETED"> | "";
  /** "true" | "false" | ""(전체). select 값을 그대로 넘기기 위해 문자열로 둔다. */
  isOfficial?: string;
  /** 특정 크리에이터가 만든 캐릭터만 조회한다. (유저 상세에서 사용) */
  creatorId?: number;
  /** 빈 문자열이면 서버 기본 정렬(등록 최신순)을 따른다. */
  sort?: CharacterSort | "";
}

export const getCharacterList = async (params: CharacterListParams) => {
  const response = await adminAxios.get<PageResponse<Character>>(
    "/admin/characters",
    { params },
  );

  return response.data;
};

/** 전체 캐릭터 화면에서 검색·필터·페이지네이션과 함께 사용합니다. */
export const useCharacterListQuery = (params: CharacterListParams) => {
  return useQuery<PageResponse<Character>, AppError>({
    queryKey: ["get-character-list", params],
    queryFn: () => getCharacterList(params),
  });
};
