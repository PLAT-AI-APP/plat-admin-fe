import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CharacterDetail } from "@/type/character";

export const getCharacterDetail = async (characterId: number) => {
  const response = await adminAxios.get<CharacterDetail>(
    `/admin/characters/${characterId}`,
  );

  return response.data;
};

/**
 * 캐릭터 상세 모달 · 공식 캐릭터 수정 폼에서 사용합니다.
 * characterId가 없으면(모달이 닫혀 있으면) 조회하지 않습니다.
 */
export const useCharacterDetailQuery = (characterId: number | null) => {
  return useQuery<CharacterDetail, AppError>({
    queryKey: ["get-character-detail", characterId],
    queryFn: () => getCharacterDetail(Number(characterId)),
    enabled: characterId !== null,
  });
};
