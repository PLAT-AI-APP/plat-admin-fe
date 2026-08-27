import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { ServerHealth } from "@/type/ops";

export const getServerHealth = async () => {
  const response = await liveAxios.get<ServerHealth>("/admin/server/health");

  return response.data;
};

/**
 * 실서버의 현재 상태를 조회합니다. 요청받은 순간에 DB · Redis를 직접 찔러 보고
 * 답하므로 응답이 오래된 값일 수 없습니다.
 *
 * 캐시를 두지 않는 이유도 같습니다. 이 화면을 여는 이유는 **지금** 살아 있는지
 * 보기 위해서인데, 캐시된 "정상"을 보여 주면 화면을 볼 이유가 없어집니다.
 */
export const useServerHealthQuery = () => {
  return useQuery<ServerHealth, AppError>({
    queryKey: ["get-server-health"],
    queryFn: getServerHealth,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
