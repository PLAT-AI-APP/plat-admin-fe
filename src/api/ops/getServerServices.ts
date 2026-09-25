import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { ServiceStatus } from "@/type/ops";

export const getServerServices = async () => {
  const response = await liveAxios.get<ServiceStatus[]>("/server/services");

  return response.data;
};

/**
 * 서비스별 인스턴스 상태를 조회합니다. 각 앱이 10초마다 알린 값을 서버가 서비스
 * 단위로 묶어 줍니다. 한 번도 뜨지 못한 서비스도 빈 인스턴스 목록으로 옵니다.
 *
 * 서버 상태 조회와 같은 이유로 캐시를 두지 않습니다.
 */
export const useServerServicesQuery = () => {
  return useQuery<ServiceStatus[], AppError>({
    queryKey: ["get-server-services"],
    queryFn: getServerServices,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};
