import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { DummyCreator } from "@/type/user";

export interface DummyCreatorListParams {
  keyword?: string;
}

export const getDummyCreatorList = async (params: DummyCreatorListParams) => {
  const response = await adminAxios.get<DummyCreator[]>(
    "/admin/dummy-creators",
    { params },
  );

  return response.data;
};

/** 더미 크리에이터는 건수가 적어 페이지네이션 없이 전체를 내려받습니다. */
export const useDummyCreatorListQuery = (params: DummyCreatorListParams) => {
  return useQuery<DummyCreator[], AppError>({
    queryKey: ["get-dummy-creator-list", params],
    queryFn: () => getDummyCreatorList(params),
  });
};
