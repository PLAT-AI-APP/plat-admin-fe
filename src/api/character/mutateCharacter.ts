import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Character, CharacterVisibility } from "@/type/character";
import { showAppToast } from "@/lib/toast";

export const updateCharacterVisibility = async (
  characterId: number,
  visibility: CharacterVisibility,
) => {
  const response = await adminAxios.patch<Character>(
    `/admin/characters/${characterId}/visibility`,
    { visibility },
  );

  return response.data;
};

export const deleteCharacter = async (characterId: number) => {
  await adminAxios.delete(`/admin/characters/${characterId}`);
};

/** 캐릭터 노출 상태 변경·삭제 후 전체/공식 목록을 함께 갱신합니다. */
export const useCharacterMutation = () => {
  const queryClient = useQueryClient();

  const invalidateCharacterQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["get-character-list"] });
    queryClient.invalidateQueries({
      queryKey: ["get-official-character-list"],
    });
    queryClient.invalidateQueries({ queryKey: ["get-character-detail"] });
  };

  const visibilityMutation = useMutation<
    Character,
    AppError,
    { characterId: number; visibility: CharacterVisibility }
  >({
    mutationFn: ({ characterId, visibility }) =>
      updateCharacterVisibility(characterId, visibility),
    onSuccess: () => {
      showAppToast("success", "캐릭터 노출 상태를 변경했습니다.");
      invalidateCharacterQueries();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteCharacter,
    onSuccess: () => {
      showAppToast("success", "캐릭터를 삭제했습니다.");
      invalidateCharacterQueries();
    },
  });

  return { visibilityMutation, deleteMutation };
};
