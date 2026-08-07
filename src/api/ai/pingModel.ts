import { useMutation } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AiModelPingResult } from "@/type/ai";
import type { AppError } from "@/type/api";
import { showAppToast } from "@/lib/toast";
import { formatWithCommas } from "@/lib/utils";

export const pingModel = async (model: string) => {
  const response = await adminAxios.post<AiModelPingResult>(
    `/admin/ai/models/${model}/ping`,
  );

  return response.data;
};

/**
 * 모델 테스트 호출.
 * 호출 자체가 성공해도 모델 응답이 실패할 수 있어, 응답 본문의 isSuccess로 토스트를 나눕니다.
 */
export const useModelPingMutation = () => {
  return useMutation<AiModelPingResult, AppError, string>({
    mutationFn: pingModel,
    onSuccess: (result) => {
      showAppToast(
        result.isSuccess ? "success" : "error",
        result.isSuccess
          ? `${result.model} 테스트 호출에 성공했습니다.`
          : `${result.model} 테스트 호출에 실패했습니다.`,
        {
          description: `${result.message} (응답 시간 ${formatWithCommas(result.latencyMs)}ms)`,
        },
      );
    },
  });
};
