import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { AiKeyOverview } from "@/type/aiKey";

export const AI_KEYS_QUERY_KEY = ["get-ai-keys"] as const;

export const getAiKeys = async () => {
  const response = await liveAxios.get<AiKeyOverview>("/server/ai-keys");

  return response.data;
};

/**
 * 제공사별 메인 · 서브 키와 지금 쓰는 자리, 인스턴스별 반영 상태.
 *
 * 서브로 넘어가거나 돌아오는 것은 서버가 알아서 바꾸므로 10초마다 다시 부른다.
 */
export const useAiKeysQuery = () =>
  useQuery<AiKeyOverview, AppError>({
    queryKey: AI_KEYS_QUERY_KEY,
    queryFn: getAiKeys,
    staleTime: 0,
    retry: false,
    refetchInterval: 10_000,
  });
