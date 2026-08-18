import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { UniverseDetail } from "@/type/character";

export const getUniverseDetail = async (universeId: number) => {
  const response = await adminAxios.get<UniverseDetail>(
    `/admin/universes/${universeId}`,
  );

  return response.data;
};

/**
 * 세계관 상세.
 * 목록 응답에 시나리오(에피소드)를 더해 내려줍니다.
 */
export const useUniverseDetailQuery = (universeId: number | null) => {
  return useQuery<UniverseDetail, AppError>({
    queryKey: ["get-universe-detail", universeId],
    queryFn: () => getUniverseDetail(Number(universeId)),
    enabled: universeId !== null,
  });
};
