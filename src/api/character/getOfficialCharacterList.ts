import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";

export interface OfficialCharacterListParams {
  page: number;
  size: number;
  keyword?: string;
  visibility?: CharacterVisibility | "";
}

export const getOfficialCharacterList = async (
  params: OfficialCharacterListParams,
) => {
  const response = await adminAxios.get<PageResponse<Character>>(
    "/admin/characters/official",
    { params },
  );

  return response.data;
};

/** 공식 캐릭터 화면 전용 목록. 전체 캐릭터 목록과 캐시를 분리합니다. */
export const useOfficialCharacterListQuery = (
  params: OfficialCharacterListParams,
) => {
  return useQuery<PageResponse<Character>, AppError>({
    queryKey: ["get-official-character-list", params],
    queryFn: () => getOfficialCharacterList(params),
  });
};
