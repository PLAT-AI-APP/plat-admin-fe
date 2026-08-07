import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { Manager } from "@/type/ops";

export const getManagerList = async () => {
  const response = await adminAxios.get<Manager[]>("/admin/managers");

  return response.data;
};

/** 관리자 계정 목록. 건수가 적어 페이지네이션 없이 전체를 내려받습니다. */
export const useManagerListQuery = () => {
  return useQuery<Manager[], AppError>({
    queryKey: ["get-manager-list"],
    queryFn: getManagerList,
  });
};
