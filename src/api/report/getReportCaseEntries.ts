import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { ReportEntryItem } from "@/type/report";
import { toReportEntryItem, type ReportEntryItemResponse } from "./reportMapper";

export interface ReportCaseEntriesParams {
  caseId: string;
  page: number;
  size: number;
}

export const getReportCaseEntries = async ({
  caseId,
  ...page
}: ReportCaseEntriesParams): Promise<PageResponse<ReportEntryItem>> => {
  const response = await liveAxios.get<PageWith<ReportEntryItemResponse>>(
    `/reports/${caseId}/reports`,
    { params: toPageRequest(page) },
  );

  const result = toPageResponse(response.data);

  return { ...result, content: result.content.map(toReportEntryItem) };
};

/** 케이스에 묶인 개별 신고(신고 시각 역순). 케이스 상세 하단 목록에서 씁니다. */
export const useReportCaseEntriesQuery = (params: ReportCaseEntriesParams) => {
  return usePermittedQuery<PageResponse<ReportEntryItem>>("report:read", {
    queryKey: ["get-report-case-entries", params],
    queryFn: () => getReportCaseEntries(params),
  });
};
