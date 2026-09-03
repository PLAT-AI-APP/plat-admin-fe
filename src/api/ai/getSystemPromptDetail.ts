import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { SystemPrompt, SystemPromptVersion } from "@/type/ai";
import type { AppError } from "@/type/api";

/** 서버 응답 한 줄. 작성자 계정이 지워졌으면 ID 자리가 null로 내려온다. */
export interface SystemPromptVersionResponse
  extends Omit<SystemPromptVersion, "createdById"> {
  createdById: number | null;
}

/**
 * 작성자 계정이 비어 있는 버전이 있다.
 *
 * 마이그레이션이 심은 첫 버전은 사람이 쓴 것이 아니라 이름만 있고 계정이 없다.
 * 화면은 그 자리를 이름만으로 채운다.
 */
export const toSystemPromptVersion = (
  version: SystemPromptVersionResponse,
): SystemPromptVersion => ({
  ...version,
  createdById: version.createdById ?? undefined,
});

/** 서버 응답. 프롬프트 메타에 버전 이력을 더해 내려온다. */
export interface SystemPromptDetailResponse extends SystemPrompt {
  versions: SystemPromptVersionResponse[];
}

/** 화면이 쓰는 상세. 버전 이력은 최신 버전이 앞이다. */
export interface SystemPromptDetail extends SystemPrompt {
  versions: SystemPromptVersion[];
}

export const getSystemPromptDetail = async (
  promptKey: string,
): Promise<SystemPromptDetail> => {
  const response = await liveAxios.get<SystemPromptDetailResponse>(
    `/admin/ai/prompts/${promptKey}`,
  );

  return {
    ...response.data,
    versions: response.data.versions.map(toSystemPromptVersion),
  };
};

/** 우측 상세 영역(활성 버전 내용 + 버전 이력)에서 사용합니다. */
export const useSystemPromptDetailQuery = (promptKey: string | null) => {
  return useQuery<SystemPromptDetail, AppError>({
    queryKey: ["get-system-prompt-detail", promptKey],
    queryFn: () => getSystemPromptDetail(promptKey!),
    enabled: promptKey !== null,
  });
};
