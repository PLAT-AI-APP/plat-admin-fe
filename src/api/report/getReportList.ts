import { useQuery } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError, PageResponse } from "@/type/api";
import type {
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/type/report";

export interface ReportListParams {
  page: number;
  size: number;
  keyword?: string;
  /** 빈 문자열이면 모든 대상을 조회한다. */
  targetType?: ReportTargetType | "";
  status?: ReportStatus | "";
  reason?: ReportReason | "";
  sort?: "RECENT" | "REPORTED";
}

export const getReportList = async (params: ReportListParams) => {
  const response = await adminAxios.get<PageResponse<Report>>(
    "/admin/reports",
    { params },
  );

  return response.data;
};

/** 캐릭터·댓글·유저 신고를 한 화면에서 조회합니다. */
export const useReportListQuery = (params: ReportListParams) => {
  return useQuery<PageResponse<Report>, AppError>({
    queryKey: ["get-report-list", params],
    queryFn: () => getReportList(params),
  });
};
