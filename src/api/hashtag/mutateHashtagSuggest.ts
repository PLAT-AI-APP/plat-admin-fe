import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { AppError } from "@/type/api";

interface HashtagSuggestDeleteResponse {
  /** 실제로 지운 건수. 보는 사이 다른 운영자가 지웠으면 화면에 보인 수보다 적다. */
  deletedCount: number;
}

export const deleteHashtagSuggest = async (suggestId: string) => {
  await liveAxios.delete(`/admin/hashtags/suggestions/items/${suggestId}`);
};

export const deleteHashtagSuggestGroup = async (name: string) => {
  const response = await liveAxios.delete<HashtagSuggestDeleteResponse>(
    "/admin/hashtags/suggestions",
    { params: { name } },
  );

  return response.data.deletedCount;
};

/**
 * 제안 삭제. 제안은 승인·반려가 없는 자료라 운영이 할 수 있는 유일한 조치입니다.
 * 되돌릴 수 없으므로 호출부에서 확인을 받습니다.
 */
export const useHashtagSuggestMutation = () => {
  const queryClient = useQueryClient();

  /* 묶음 목록의 건수와 원문 목록이 함께 달라진다. 한쪽만 비우면 지운 뒤 숫자가 어긋난다. */
  const invalidateSuggests = () => {
    queryClient.invalidateQueries({ queryKey: ["get-hashtag-suggest-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-hashtag-suggest-items"] });
  };

  const deleteMutation = useMutation<void, AppError, string>({
    mutationFn: deleteHashtagSuggest,
    onSuccess: () => {
      showAppToast("success", "제안을 삭제했습니다.");
      invalidateSuggests();
    },
  });

  const deleteGroupMutation = useMutation<number, AppError, string>({
    mutationFn: deleteHashtagSuggestGroup,
    onSuccess: (deletedCount) => {
      showAppToast("success", `제안 ${deletedCount}건을 삭제했습니다.`);
      invalidateSuggests();
    },
  });

  return { deleteMutation, deleteGroupMutation };
};
