import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showErrorToast } from "@/lib/toast";
import type { AppError } from "@/type/api";
import type {
  AiKeyCheckResult,
  AiKeyOverview,
  AiKeyProvider,
  AiKeySlot,
} from "@/type/aiKey";
import { AI_KEYS_QUERY_KEY } from "./getAiKeys";

interface SlotTarget {
  provider: AiKeyProvider;
  slot: AiKeySlot;
}

export interface SaveAiKeyPayload extends SlotTarget {
  apiKey: string;
  /** YYYY-MM-DD. 비우면 만료 알림을 보내지 않는다. */
  expiresOn: string | null;
}

/**
 * 키 저장 · 서브 삭제 · 메인 복귀 · 연결 확인.
 *
 * 저장하면 서버가 몇 초 안에 새 키를 읽는다(재시작 없음). 응답이 갱신된 현황이라 캐시를 그대로 덮는다.
 */
export const useAiKeyMutation = () => {
  const queryClient = useQueryClient();
  const apply = (overview: AiKeyOverview) =>
    queryClient.setQueryData(AI_KEYS_QUERY_KEY, overview);

  const saveMutation = useMutation<AiKeyOverview, AppError, SaveAiKeyPayload>({
    mutationFn: async ({ provider, slot, apiKey, expiresOn }) =>
      (
        await liveAxios.put<AiKeyOverview>(
          `/server/ai-keys/${provider}/${slot}`,
          {
            apiKey,
            expiresOn,
          },
        )
      ).data,
    onSuccess: apply,
    onError: (error) => showErrorToast(error),
  });

  const deleteMutation = useMutation<AiKeyOverview, AppError, SlotTarget>({
    mutationFn: async ({ provider, slot }) =>
      (
        await liveAxios.delete<AiKeyOverview>(
          `/server/ai-keys/${provider}/${slot}`,
        )
      ).data,
    onSuccess: apply,
    onError: (error) => showErrorToast(error),
  });

  const restoreMutation = useMutation<AiKeyOverview, AppError, AiKeyProvider>({
    mutationFn: async (provider) =>
      (
        await liveAxios.post<AiKeyOverview>(
          `/server/ai-keys/${provider}/restore-main`,
        )
      ).data,
    onSuccess: apply,
    onError: (error) => showErrorToast(error),
  });

  // 확인하기 전에 서버가 키를 다시 읽으므로, 끝나면 반영 상태도 새로 받는다.
  const checkMutation = useMutation<AiKeyCheckResult, AppError, SlotTarget>({
    mutationFn: async ({ provider, slot }) =>
      (
        await liveAxios.post<AiKeyCheckResult>(
          `/server/ai-keys/${provider}/${slot}/check`,
        )
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: AI_KEYS_QUERY_KEY }),
    onError: (error) => showErrorToast(error),
  });

  return { saveMutation, deleteMutation, restoreMutation, checkMutation };
};
