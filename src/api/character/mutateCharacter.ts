import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type {
  Character,
  CharacterStatus,
  CharacterVisibility,
} from "@/type/character";
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

/** 차단·차단 해제로 넘어갈 수 있는 상태. 삭제는 별도 엔드포인트를 쓴다. */
export type CharacterModerationStatus = Extract<
  CharacterStatus,
  "ACTIVE" | "BLOCKED"
>;

export interface CharacterStatusBody {
  status: CharacterModerationStatus;
  /** 차단 사유. 차단할 때만 보낸다. */
  reason?: string;
}

/**
 * 캐릭터 운영 상태 변경(차단 · 차단 해제).
 *
 * 노출 상태(`visibility`)와 엔드포인트를 나눈 이유는 두 값의 성격이 다르기
 * 때문이다. 노출은 크리에이터도 바꾸는 값이고, 차단은 운영자만 내리는
 * 조치라 사유가 함께 남아야 한다.
 */
export const updateCharacterStatus = async (
  characterId: number,
  body: CharacterStatusBody,
) => {
  const response = await adminAxios.patch<Character>(
    `/admin/characters/${characterId}/status`,
    body,
  );

  return response.data;
};

export const deleteCharacter = async (characterId: number) => {
  await adminAxios.delete(`/admin/characters/${characterId}`);
};

/** 캐릭터 노출 상태 변경·차단·삭제 후 전체/공식 목록을 함께 갱신합니다. */
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

  const statusMutation = useMutation<
    Character,
    AppError,
    { characterId: number; body: CharacterStatusBody }
  >({
    mutationFn: ({ characterId, body }) =>
      updateCharacterStatus(characterId, body),
    onSuccess: (_, { body }) => {
      showAppToast(
        "success",
        body.status === "BLOCKED"
          ? "캐릭터를 차단했습니다."
          : "캐릭터 차단을 해제했습니다.",
      );
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

  return { visibilityMutation, statusMutation, deleteMutation };
};
