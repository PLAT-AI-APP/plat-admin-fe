import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { CharacterDetail } from "@/type/character";
import type { OfficialCharacterSchema } from "@/schema/officialCharacter.schema";
import { showAppToast } from "@/lib/toast";

export const createOfficialCharacter = async (
  values: OfficialCharacterSchema,
) => {
  const response = await adminAxios.post<CharacterDetail>(
    "/admin/characters/official",
    values,
  );

  return response.data;
};

export const updateOfficialCharacter = async (
  characterId: number,
  values: OfficialCharacterSchema,
) => {
  const response = await adminAxios.put<CharacterDetail>(
    `/admin/characters/official/${characterId}`,
    values,
  );

  return response.data;
};

/** 공식 캐릭터 생성·수정 후 목록과 상세를 갱신합니다. */
export const useOfficialCharacterMutation = () => {
  const queryClient = useQueryClient();

  const invalidateOfficialCharacterQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["get-official-character-list"],
    });
    queryClient.invalidateQueries({ queryKey: ["get-character-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-character-detail"] });
  };

  const createMutation = useMutation<
    CharacterDetail,
    AppError,
    OfficialCharacterSchema
  >({
    mutationFn: createOfficialCharacter,
    onSuccess: () => {
      showAppToast("success", "공식 캐릭터를 등록했습니다.");
      invalidateOfficialCharacterQueries();
    },
  });

  const updateMutation = useMutation<
    CharacterDetail,
    AppError,
    { characterId: number; values: OfficialCharacterSchema }
  >({
    mutationFn: ({ characterId, values }) =>
      updateOfficialCharacter(characterId, values),
    onSuccess: () => {
      showAppToast("success", "공식 캐릭터를 수정했습니다.");
      invalidateOfficialCharacterQueries();
    },
  });

  return { createMutation, updateMutation };
};
