import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toSystemPromptVersion,
  type SystemPromptVersionResponse,
} from "./getSystemPromptDetail";
import type { SystemPrompt, SystemPromptVersion } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

export const createSystemPromptVersion = async (
  promptKey: string,
  content: string,
): Promise<SystemPromptVersion> => {
  const response = await liveAxios.put<SystemPromptVersionResponse>(
    `/admin/ai/prompts/${promptKey}`,
    { content },
  );

  return toSystemPromptVersion(response.data);
};

export const deleteSystemPromptVersion = async (
  promptKey: string,
  version: number,
) => {
  await liveAxios.delete(`/admin/ai/prompts/${promptKey}/versions/${version}`);
};

export const activateSystemPromptVersion = async (
  promptKey: string,
  version: number,
) => {
  const response = await liveAxios.post<SystemPrompt>(
    `/admin/ai/prompts/${promptKey}/activate`,
    { version },
  );

  return response.data;
};

/** 새 버전 저장·버전 활성화 후 목록과 상세를 함께 갱신합니다. */
export const useSystemPromptMutation = () => {
  const queryClient = useQueryClient();

  const invalidateSystemPrompt = () => {
    queryClient.invalidateQueries({ queryKey: ["get-system-prompt-list"] });
    queryClient.invalidateQueries({ queryKey: ["get-system-prompt-detail"] });
  };

  const createVersionMutation = useMutation<
    SystemPromptVersion,
    AppError,
    { promptKey: string; content: string }
  >({
    mutationFn: ({ promptKey, content }) =>
      createSystemPromptVersion(promptKey, content),
    onSuccess: (version) => {
      showAppToast("success", `v${version.version} 버전을 저장했습니다.`, {
        description: "저장한 버전은 활성화해야 실제 대화에 적용됩니다.",
      });
      invalidateSystemPrompt();
    },
  });

  const activateMutation = useMutation<
    SystemPrompt,
    AppError,
    { promptKey: string; version: number }
  >({
    mutationFn: ({ promptKey, version }) =>
      activateSystemPromptVersion(promptKey, version),
    onSuccess: (prompt) => {
      showAppToast("success", `v${prompt.activeVersion} 버전을 활성화했습니다.`);
      invalidateSystemPrompt();
    },
  });

  /** 활성 버전은 서버가 막는다. 화면도 버튼을 감추지만, 판정의 출처는 서버다. */
  const deleteVersionMutation = useMutation<
    void,
    AppError,
    { promptKey: string; version: number }
  >({
    mutationFn: ({ promptKey, version }) =>
      deleteSystemPromptVersion(promptKey, version),
    onSuccess: (_, { version }) => {
      showAppToast("success", `v${version} 버전을 삭제했습니다.`);
      invalidateSystemPrompt();
    },
  });

  return { createVersionMutation, activateMutation, deleteVersionMutation };
};
