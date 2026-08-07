import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AiModel } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";

/** 운영 설정만 변경한다. 모델명·제공사는 카탈로그가 소유하므로 바꾸지 않는다. */
export interface UpdateAiModelRequest {
  isEnabled?: boolean;
  isDefault?: boolean;
  creditCost?: number;
  maxOutputTokens?: number;
  temperature?: number;
  memo?: string;
}

export const updateAiModel = async (
  modelId: number,
  body: UpdateAiModelRequest,
) => {
  const response = await adminAxios.put<AiModel>(
    `/admin/ai/models/${modelId}`,
    body,
  );

  return response.data;
};

/**
 * 모델 운영 설정 변경.
 * 기본 모델 지정은 서버에서 나머지 모델의 isDefault를 해제하므로 목록 전체를 다시 조회합니다.
 */
export const useAiModelMutation = () => {
  const queryClient = useQueryClient();

  const invalidateAiModelList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-ai-model-list"] });

  const updateMutation = useMutation<
    AiModel,
    AppError,
    { modelId: number; body: UpdateAiModelRequest; successMessage?: string }
  >({
    mutationFn: ({ modelId, body }) => updateAiModel(modelId, body),
    onSuccess: (_, { successMessage }) => {
      showAppToast("success", successMessage ?? "모델 설정을 저장했습니다.");
      invalidateAiModelList();
    },
  });

  return { updateMutation };
};
