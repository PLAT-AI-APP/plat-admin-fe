import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AiModelCatalogItem, AiProvider } from "@/type/ai";
import type { AppError } from "@/type/api";

export interface ModelCatalogParams {
  provider?: AiProvider;
}

export const getModelCatalog = async (params: ModelCatalogParams) => {
  const response = await adminAxios.get<AiModelCatalogItem[]>(
    "/admin/ai/models/catalog",
    { params },
  );

  return response.data;
};

/** 제공사에서 제공하는 모델 원본 정보입니다. 운영 설정과는 무관합니다. */
export const useModelCatalogQuery = (params: ModelCatalogParams) => {
  return useQuery<AiModelCatalogItem[], AppError>({
    queryKey: ["get-model-catalog", params],
    queryFn: () => getModelCatalog(params),
  });
};
