import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import {
  toPageRequest,
  toPageResponse,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type {
  ReportCaseItem,
  ReportCaseSort,
  ReportCaseStatus,
  ReportReason,
  ReportTargetType,
} from "@/type/report";
import { toReportCaseItem, type ReportCaseItemResponse } from "./reportMapper";

export interface ReportCaseListParams {
  /** 화면은 1부터, 서버는 0부터 센다. 변환은 이 파일에서만 한다. */
  page: number;
  size: number;
  /** 대상 제목 · 발췌 · 피신고자 닉네임 */
  keyword?: string;
  status?: ReportCaseStatus | "";
  targetType?: ReportTargetType | "";
  /** 이 사유의 신고가 1건 이상인 케이스 */
  reason?: ReportReason | "";
  /** 이 유저가 피신고자인 케이스만 (유저 상세에서 사용) */
  ownerUserId?: string;
  sort?: ReportCaseSort;
}

/** 빈 필터는 서버에 보내지 않는다(enum 파싱 실패 방지). */
const toRequestParams = (params: ReportCaseListParams) => {
  const clean: Record<string, string | number> = { ...toPageRequest(params) };
  if (params.keyword?.trim()) clean.keyword = params.keyword.trim();
  if (params.status) clean.status = params.status;
  if (params.targetType) clean.targetType = params.targetType;
  if (params.reason) clean.reason = params.reason;
  if (params.ownerUserId) clean.ownerUserId = params.ownerUserId;
  if (params.sort) clean.sort = params.sort;

  return clean;
};

export const getReportCaseList = async (
  params: ReportCaseListParams,
): Promise<PageResponse<ReportCaseItem>> => {
  const response = await liveAxios.get<PageWith<ReportCaseItemResponse>>(
    "/admin/reports",
    { params: toRequestParams(params) },
  );

  const page = toPageResponse(response.data);

  return { ...page, content: page.content.map(toReportCaseItem) };
};

/** 신고 케이스 목록. 신고 관리 화면과 유저 상세(신고당한 건)에서 씁니다. */
export const useReportCaseListQuery = (params: ReportCaseListParams) => {
  return usePermittedQuery<PageResponse<ReportCaseItem>>("report:read", {
    queryKey: ["get-report-case-list", params],
    queryFn: () => getReportCaseList(params),
  });
};

export type ReportCaseStatusCounts = Record<ReportCaseStatus, number>;

const STATUSES: ReportCaseStatus[] = ["PENDING", "ACTIONED", "DISMISSED"];

/**
 * 상태 탭 건수. 상태별로 한 줄씩만 받아 총 개수만 읽는다.
 *
 * 서버에 건수 전용 API가 없어 목록을 세 번 부른다. 탭 옆 숫자는 지금 건 필터 기준이어야
 * 눌렀을 때 나오는 목록과 맞으므로, 상태를 뺀 나머지 조건은 목록과 같게 보낸다.
 */
export const getReportCaseStatusCounts = async (
  filters: Omit<ReportCaseListParams, "page" | "size" | "status" | "sort">,
): Promise<ReportCaseStatusCounts> => {
  const totals = await Promise.all(
    STATUSES.map((status) =>
      getReportCaseList({ ...filters, status, page: 1, size: 1 }).then(
        (page) => page.totalCount,
      ),
    ),
  );

  return Object.fromEntries(
    STATUSES.map((status, index) => [status, totals[index]]),
  ) as ReportCaseStatusCounts;
};

/** 신고 관리 상태 탭 옆에 건수를 붙일 때 씁니다. */
export const useReportCaseStatusCountsQuery = (
  filters: Omit<ReportCaseListParams, "page" | "size" | "status" | "sort">,
) => {
  return usePermittedQuery<ReportCaseStatusCounts>("report:read", {
    queryKey: ["get-report-case-status-counts", filters],
    queryFn: () => getReportCaseStatusCounts(filters),
  });
};
