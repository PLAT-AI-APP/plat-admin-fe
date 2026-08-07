import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { SystemPrompt, SystemPromptVersion } from "@/type/ai";
import type { AppError } from "@/type/api";

/** 상세 응답은 프롬프트 메타에 버전 이력을 더해 내려온다. (최신 버전이 앞) */
export interface SystemPromptDetail extends SystemPrompt {
  versions: SystemPromptVersion[];
}

export const getSystemPromptDetail = async (promptKey: string) => {
  const response = await adminAxios.get<SystemPromptDetail>(
    `/admin/ai/prompts/${promptKey}`,
  );

  return response.data;
};

/** 우측 상세 영역(활성 버전 내용 + 버전 이력)에서 사용합니다. */
export const useSystemPromptDetailQuery = (promptKey: string | null) => {
  return useQuery<SystemPromptDetail, AppError>({
    queryKey: ["get-system-prompt-detail", promptKey],
    queryFn: () => getSystemPromptDetail(promptKey!),
    enabled: promptKey !== null,
  });
};
