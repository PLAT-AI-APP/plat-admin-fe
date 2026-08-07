import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { SystemPrompt, SystemPromptVersion } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

export const createSystemPromptVersion = async (
  promptKey: string,
  content: string,
) => {
  const response = await adminAxios.put<SystemPromptVersion>(
    `/admin/ai/prompts/${promptKey}`,
    { content },
  );

  return response.data;
};

export const activateSystemPromptVersion = async (
  promptKey: string,
  version: number,
) => {
  const response = await adminAxios.post<SystemPrompt>(
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

  return { createVersionMutation, activateMutation };
};
