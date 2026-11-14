import { keepPreviousData } from "@tanstack/react-query";
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
    // 페이지·필터를 바꿔도 새 결과가 올 때까지 이전 목록을 그대로 둔다(표가 스켈레톤으로 깜빡이지 않는다).
    placeholderData: keepPreviousData,
  });
};
