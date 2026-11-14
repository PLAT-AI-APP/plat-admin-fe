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

export interface ReporterEntriesParams {
  reporterUserId: string;
  page: number;
  size: number;
}

export const getReporterEntries = async ({
  reporterUserId,
  ...page
}: ReporterEntriesParams): Promise<PageResponse<ReportEntryItem>> => {
  const response = await liveAxios.get<PageWith<ReportEntryItemResponse>>(
    "/reports/items",
    { params: { ...toPageRequest(page), reporterUserId } },
  );

  const result = toPageResponse(response.data);

  return { ...result, content: result.content.map(toReportEntryItem) };
};

/** 이 유저가 넣은 신고. 유저 상세의 신고 이력 탭에서 씁니다. */
export const useReporterEntriesQuery = (params: ReporterEntriesParams) => {
  return usePermittedQuery<PageResponse<ReportEntryItem>>("report:read", {
    queryKey: ["get-reporter-entries", params],
    queryFn: () => getReporterEntries(params),
    // 페이지·필터를 바꿔도 새 결과가 올 때까지 이전 목록을 그대로 둔다(표가 스켈레톤으로 깜빡이지 않는다).
    placeholderData: keepPreviousData,
  });
};
