import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { BannedWordSchema } from "@/schema/bannedWord.schema";
import type { AppError } from "@/type/api";
import type { BannedWord, BannedWordType } from "@/type/bannedWord";

/** 서버 응답. 목록과 같은 형태로 내려오므로 ID도 문자열이다. */
interface BannedWordResponse {
  bannedWordId: string;
  word: string;
  type: BannedWordType;
  createdBy: string;
  createdById: number | null;
  createdAt: string;
}

const toBannedWord = (word: BannedWordResponse): BannedWord => ({
  ...word,
  bannedWordId: Number(word.bannedWordId),
  createdById: word.createdById ?? undefined,
});

export const createBannedWord = async (values: BannedWordSchema) => {
  const response = await liveAxios.post<BannedWordResponse>(
    "/admin/banned-words",
    values,
  );

  return toBannedWord(response.data);
};

export const deleteBannedWord = async (bannedWordId: number) => {
  await liveAxios.delete(`/admin/banned-words/${bannedWordId}`);
};

/** 금지어 추가·삭제 후 목록을 갱신합니다. */
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

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteBannedWord,
    onSuccess: () => {
      showAppToast("success", "단어를 삭제했습니다. 검사에서 즉시 제외됩니다.");
      invalidateBannedWordList();
    },
  });

  return { createMutation, deleteMutation };
};
