import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { NsfwKeyword } from "@/type/character";
import type { NsfwKeywordSchema } from "@/schema/nsfwKeyword.schema";
import { showAppToast } from "@/lib/toast";

export const createNsfwKeyword = async (values: NsfwKeywordSchema) => {
  const response = await adminAxios.post<NsfwKeyword>(
    "/admin/nsfw-keywords",
    values,
  );

  return response.data;
};

export const deleteNsfwKeyword = async (keywordId: number) => {
  await adminAxios.delete(`/admin/nsfw-keywords/${keywordId}`);
};

/** NSFW 키워드 추가·삭제 후 목록을 갱신합니다. */
export const useNsfwKeywordMutation = () => {
  const queryClient = useQueryClient();

  const invalidateNsfwKeywordList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-nsfw-keyword-list"] });

  const createMutation = useMutation<NsfwKeyword, AppError, NsfwKeywordSchema>({
    mutationFn: createNsfwKeyword,
    onSuccess: () => {
      showAppToast("success", "키워드를 추가했습니다.");
      invalidateNsfwKeywordList();
    },
  });

  const deleteMutation = useMutation<void, AppError, number>({
    mutationFn: deleteNsfwKeyword,
    onSuccess: () => {
      showAppToast("success", "키워드를 삭제했습니다.");
      invalidateNsfwKeywordList();
    },
  });

  return { createMutation, deleteMutation };
};
