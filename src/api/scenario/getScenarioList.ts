import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type { Scenario } from "@/type/character";

export interface ScenarioListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 공식 세계관만 후보로 제한할 때 사용한다. */
  officialOnly?: boolean;
  sort?: "RECENT" | "ASSET_COUNT" | "CHAT_COUNT";
}

export const getScenarioList = async (params: ScenarioListParams) => {
  const response = await adminAxios.get<PageResponse<Scenario>>(
    "/admin/scenarios",
    { params },
  );

  return response.data;
};

/** 메인 노출 큐레이션의 후보 목록과 세계관 관리 화면에서 함께 사용합니다. */
export const useScenarioListQuery = (params: ScenarioListParams) => {
  return useQuery<PageResponse<Scenario>, AppError>({
    queryKey: ["get-scenario-list", params],
    queryFn: () => getScenarioList(params),
  });
};
