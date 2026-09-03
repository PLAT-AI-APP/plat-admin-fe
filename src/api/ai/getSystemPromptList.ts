import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { SystemPrompt } from "@/type/ai";
import type { AppError } from "@/type/api";

export const getSystemPromptList = async () => {
  const response = await liveAxios.get<SystemPrompt[]>("/admin/ai/prompts");

  return response.data;
};

/**
 * 시스템 프롬프트 좌측 키 목록에서 사용합니다.
 *
 * 어떤 프롬프트가 존재하는지는 서버가 정하고 순서도 서버가 준 그대로 씁니다.
 * 조회할 때마다 좌측 목록이 뒤바뀌면 운영자가 자리를 외울 수 없습니다.
 */
export const useSystemPromptListQuery = () => {
  return useQuery<SystemPrompt[], AppError>({
    queryKey: ["get-system-prompt-list"],
    queryFn: getSystemPromptList,
  });
};
