import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { BannedWordSchema } from "@/schema/bannedWord.schema";
import type { AppError } from "@/type/api";
import type { BannedWord, BannedWordLevel } from "@/type/bannedWord";

export const createBannedWord = async (values: BannedWordSchema) => {
  const response = await adminAxios.post<BannedWord>(
    "/admin/banned-words",
    values,
  );

  return response.data;
};

/**
 * 처리 레벨만 바꾼다.
 *
 * 단어와 유형을 고치는 길은 두지 않는다. 그것은 수정이 아니라 다른 규칙이고,
 * 그 단어가 지금까지 몇 번 걸렸는지가 뜻을 잃는다. 바꾸려면 지우고 다시 넣는다.
 */
export const updateBannedWordLevel = async (
  bannedWordId: number,
  level: BannedWordLevel,
) => {
  const response = await adminAxios.patch<BannedWord>(
    `/admin/banned-words/${bannedWordId}/level`,
    { level },
  );

  return response.data;
};

export const deleteBannedWord = async (bannedWordId: number) => {
  await adminAxios.delete(`/admin/banned-words/${bannedWordId}`);
};

/** 금지어 추가·수정·삭제 후 목록을 갱신합니다. */
export const useBannedWordMutation = () => {
  const queryClient = useQueryClient();

  const invalidateBannedWordList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-banned-word-list"] });

  const createMutation = useMutation<BannedWord, AppError, BannedWordSchema>({
    mutationFn: createBannedWord,
    onSuccess: (word) => {
      showAppToast(
        "success",
        word.type === "BAN"
          ? "금지어를 추가했습니다. 지금부터 바로 검사에 반영됩니다."
          : "예외어를 추가했습니다. 이 단어에 포함된 금지어는 통과합니다.",
      );
      invalidateBannedWordList();
    },
  });

  const levelMutation = useMutation<
    BannedWord,
    AppError,
    { bannedWordId: number; level: BannedWordLevel }
  >({
    mutationFn: ({ bannedWordId, level }) =>
      updateBannedWordLevel(bannedWordId, level),
    onSuccess: () => {
      showAppToast("success", "처리 레벨을 변경했습니다.");
      invalidateBannedWordList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteBannedWord,
    onSuccess: () => {
      showAppToast("success", "단어를 삭제했습니다. 검사에서 즉시 제외됩니다.");
      invalidateBannedWordList();
    },
  });

  return { createMutation, levelMutation, deleteMutation };
};
