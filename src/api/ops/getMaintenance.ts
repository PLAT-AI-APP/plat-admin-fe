import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { MaintenanceOverview } from "@/type/ops";

export const getMaintenance = async () => {
  const response = await liveAxios.get<MaintenanceOverview>(
    "/server/maintenance",
  );

  return response.data;
};

/**
 * 점검 현황. 예약 · 이력과 함께 인스턴스별 진행 중 요청 · 생성 수, 승인 전 결제 수를 준다.
 *
 * 소프트 종료 중에는 진행 중 수가 0 으로 떨어지는지를 지켜보는 화면이라, 서비스 상태처럼
 * 5초마다 다시 부른다. 인스턴스가 알린 값(10초 간격)을 읽기만 해 가볍다.
 */
export const useMaintenanceQuery = () =>
  useQuery<MaintenanceOverview, AppError>({
    queryKey: ["get-server-maintenance"],
    queryFn: getMaintenance,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchInterval: 5_000,
  });
