import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AiModel, AiModelRole } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast, showErrorToast } from "@/lib/toast";

/** 운영 설정만 변경한다. 모델명·제공사는 카탈로그가 소유하므로 바꾸지 않는다. */
export interface UpdateAiModelRequest {
  isEnabled?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
  memo?: string;
  /** 1M 토큰당 원 */
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
  cacheReadPricePerMillion?: number;
  cacheWritePricePerMillion?: number;
  /** 청구용 평균 캐시 비율(만분율) */
  cacheRatioBps?: number;
  /** 판매 배수 k 덮어쓰기(만분율). 손익분기 배수보다 낮으면 400 */
  priceMultiplierBps?: number;
  /** true 면 덮어쓰기를 비워 과금 정책의 k 로 되돌린다 */
  useDefaultPriceMultiplier?: boolean;
}

export const updateAiModel = async (
  modelId: number,
  body: UpdateAiModelRequest,
) => {
  await liveAxios.patch(`/ai/models/${modelId}`, body);
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
    `/ai/models/${modelId}/roles/${role}`,
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
    // 판매 배수가 손익분기 미만이면 서버가 거절한다. 사유를 보여 줘야 모달에서 고칠 수 있다.
    onError: (error) => showErrorToast(error),
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
