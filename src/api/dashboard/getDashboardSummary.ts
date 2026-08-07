import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { DashboardSummary } from "@/type/dashboard";

export const getDashboardSummary = async () => {
  const response = await adminAxios.get<DashboardSummary>(
    "/admin/dashboard/summary",
  );

  return response.data;
};

/** 대시보드 지표 카드 · 추이 차트 · 서버 요약을 한 번에 조회합니다. */
export const useDashboardSummaryQuery = () => {
  return useQuery<DashboardSummary, AppError>({
    queryKey: ["get-dashboard-summary"],
    queryFn: getDashboardSummary,
  });
};
