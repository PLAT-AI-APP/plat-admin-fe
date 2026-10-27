import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { AiCostReport } from "@/type/aiCost";

export interface AiCostParams {
  /** YYYY-MM-DD. 비우면 서버가 오늘까지 30일로 잡는다. */
  from?: string;
  to?: string;
}

export const getAiCosts = async ({ from, to }: AiCostParams) => {
  const response = await liveAxios.get<AiCostReport>("/ai/costs", {
    params: { from: from || undefined, to: to || undefined },
  });

  return response.data;
};

/** 기간의 AI 원가 · 매출 · 모델별 · 유저별 집계를 한 번에 조회합니다. */
export const useAiCostsQuery = (params: AiCostParams, enabled = true) => {
  return useQuery<AiCostReport, AppError>({
    queryKey: ["get-ai-costs", params.from ?? "", params.to ?? ""],
    queryFn: () => getAiCosts(params),
    enabled,
  });
};
