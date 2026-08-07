import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { ServerHealth } from "@/type/ops";

export const getServerHealth = async () => {
  const response = await adminAxios.get<ServerHealth>("/admin/server/health");

  return response.data;
};

/** 서버 상태 화면의 새로고침 버튼이 refetch를 그대로 호출합니다. */
export const useServerHealthQuery = () => {
  return useQuery<ServerHealth, AppError>({
    queryKey: ["get-server-health"],
    queryFn: getServerHealth,
  });
};
