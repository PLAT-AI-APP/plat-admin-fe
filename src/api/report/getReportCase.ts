import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import type { ReportCaseDetail } from "@/type/report";
import { toReportCaseDetail, type ReportCaseDetailResponse } from "./reportMapper";

export const getReportCase = async (caseId: string): Promise<ReportCaseDetail> => {
  const response = await liveAxios.get<ReportCaseDetailResponse>(
    `/reports/${caseId}`,
  );

  return toReportCaseDetail(response.data);
};

/**
 * 신고 케이스 상세. 스냅샷 · 대상 현재 상태 · 사유별 건수 · 처리 결과 · 지난 케이스를 한 번에 받는다.
 *
 * 여러 관리자가 같은 대기 목록을 보므로 캐시를 들고 있으면 이미 닫힌 케이스를 대기로 보고
 * 처리하려 들게 된다. 열 때마다 다시 읽는다.
 */
export const useReportCaseQuery = (caseId: string) => {
  return usePermittedQuery<ReportCaseDetail>("report:read", {
    queryKey: ["get-report-case", caseId],
    queryFn: () => getReportCase(caseId),
    staleTime: 0,
  });
};
