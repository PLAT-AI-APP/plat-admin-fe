import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AiModel, AiModelRole } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

/** 운영 설정만 변경한다. 모델명·제공사는 카탈로그가 소유하므로 바꾸지 않는다. */
export interface UpdateAiModelRequest {
  isEnabled?: boolean;
  creditCost?: number;
  maxOutputTokens?: number;
  temperature?: number;
  memo?: string;
}

export const updateAiModel = async (
  modelId: number,
  body: UpdateAiModelRequest,
) => {
  await liveAxios.patch(`/admin/ai/models/${modelId}`, body);
};

/**
 * 역할을 이 모델에 건다.
 *
 * 역할은 운영 설정의 한 필드가 아니라 **역할 쪽이 모델을 가리키는 관계**라 경로를
 * 따로 둔다. 같은 요청을 두 번 보내도 결과가 같고, 이전에 그 역할을 갖고 있던
 * 모델은 서버가 풀어 준다.
 */
export const assignAiModelRole = async (modelId: number, role: AiModelRole) => {
  const response = await liveAxios.put<AiModel>(
    `/admin/ai/models/${modelId}/roles/${role}`,
  );

  return response.data;
};

/**
 * 모델 운영 설정 변경과 역할 지정.
 * 역할 지정은 서버에서 이전 모델의 역할을 해제하므로 목록 전체를 다시 조회합니다.
 */
export const useAiModelMutation = () => {
  const queryClient = useQueryClient();

  const invalidateAiModelList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-ai-model-list"] });

  const updateMutation = useMutation<
    void,
    AppError,
    { modelId: number; body: UpdateAiModelRequest; successMessage?: string }
  >({
    mutationFn: ({ modelId, body }) => updateAiModel(modelId, body),
    onSuccess: (_, { successMessage }) => {
      showAppToast("success", successMessage ?? "모델 설정을 저장했습니다.");
      invalidateAiModelList();
    },
  });

  const assignRoleMutation = useMutation<
    AiModel,
    AppError,
    { modelId: number; role: AiModelRole; successMessage?: string }
  >({
    mutationFn: ({ modelId, role }) => assignAiModelRole(modelId, role),
    onSuccess: (_, { successMessage }) => {
      showAppToast("success", successMessage ?? "역할을 지정했습니다.");
      invalidateAiModelList();
    },
  });

  return { updateMutation, assignRoleMutation };
};
