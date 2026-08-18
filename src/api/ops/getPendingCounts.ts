import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { PendingCounts } from "@/type/ops";

export const getPendingCounts = async () => {
  const response = await adminAxios.get<PendingCounts>(
    "/admin/ops/pending-counts",
  );

  return response.data;
};

/** 뱃지 폴링 주기. 너무 잦으면 서버를, 너무 뜸하면 운영자를 붙잡는다. */
const PENDING_REFETCH_MS = 60_000;

/**
 * 처리 대기 건수.
 *
 * 대시보드 요약과 따로 둔다. 대시보드는 화면을 열 때 한 번 보는 값이고,
 * 이 값은 콘솔에 머무는 내내 갱신되어야 한다.
 */
export const usePendingCountsQuery = () => {
  return useQuery<PendingCounts, AppError>({
    queryKey: ["get-pending-counts"],
    queryFn: getPendingCounts,
    refetchInterval: PENDING_REFETCH_MS,
    // 목록에서 처리하고 돌아오면 바로 줄어들어야 한다.
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};
