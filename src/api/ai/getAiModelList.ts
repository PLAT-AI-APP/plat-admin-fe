import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AiModel } from "@/type/ai";
import type { AppError } from "@/type/api";

export const getAiModelList = async () => {
  const response = await adminAxios.get<AiModel[]>("/admin/ai/models");

  return response.data;
};

/** 운영에서 실제로 사용 중인 모델 설정 목록입니다. */
export const useAiModelListQuery = () => {
  return useQuery<AiModel[], AppError>({
    queryKey: ["get-ai-model-list"],
    queryFn: getAiModelList,
  });
};
