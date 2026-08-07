import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { SystemPrompt } from "@/type/ai";
import type { AppError } from "@/type/api";

export const getSystemPromptList = async () => {
  const response = await adminAxios.get<SystemPrompt[]>("/admin/ai/prompts");

  return response.data;
};

/** 시스템 프롬프트 좌측 키 목록에서 사용합니다. */
export const useSystemPromptListQuery = () => {
  return useQuery<SystemPrompt[], AppError>({
    queryKey: ["get-system-prompt-list"],
    queryFn: getSystemPromptList,
  });
};
