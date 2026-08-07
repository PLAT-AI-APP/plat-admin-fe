import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";

export interface CharacterListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 모든 노출 상태를 조회한다. */
  visibility?: CharacterVisibility | "";
  /** "true" | "false" | ""(전체). select 값을 그대로 넘기기 위해 문자열로 둔다. */
  isOfficial?: string;
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
