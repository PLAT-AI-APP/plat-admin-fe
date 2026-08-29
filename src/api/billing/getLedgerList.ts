import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { LedgerEntry, LedgerType } from "@/type/billing";

export interface LedgerListParams {
  page: number;
  size: number;
  keyword?: string;
  type?: LedgerType | "";
  /** YYYY-MM-DD (KST 기준 날짜) */
  startDate?: string;
  endDate?: string;
  /** 특정 유저의 장부만 조회한다. (유저 상세에서 사용) */
  userId?: string;
}

/**
 * 서버 장부 한 줄.
 *
 * 원장 ID와 유저 ID는 Snowflake라 문자열로 내려온다. **숫자로 바꾸지 않는다** —
 * 18~19자리라 `MAX_SAFE_INTEGER`를 넘겨 끝자리가 뭉개진다.
 */
interface LedgerEntryResponse {
  ledgerId: string;
  type: LedgerType;
  userId: string;
  userNickname: string | null;
  amount: number;
  creditDelta: number;
  productName: string | null;
  memo: string | null;
  createdAt: string;
}

const toLedgerEntry = (entry: LedgerEntryResponse): LedgerEntry => ({
  ...entry,
  userNickname: entry.userNickname ?? `#${entry.userId}`,
  productName: entry.productName ?? undefined,
  memo: entry.memo ?? "",
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: LedgerListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  type: params.type || undefined,
  startDate: params.startDate || undefined,
  endDate: params.endDate || undefined,
  userId: params.userId || undefined,
});

export const getLedgerList = async (
  params: LedgerListParams,
): Promise<PageResponse<LedgerEntry>> => {
  const response = await liveAxios.get<PageWith<LedgerEntryResponse>>(
    "/admin/ledger",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toLedgerEntry),
  });
};

/**
 * 결제·크레딧 장부.
 *
 * 조정 이력과 겹쳐 보이지만 다르다. 장부는 크레딧이 움직인 **모든 경로**를 담고,
 * 조정 이력은 그중 운영자가 개입한 것만 처리자와 함께 담는다.
 *
 * 정렬은 서버가 최근순으로 고정한다. 기간은 KST 날짜 기준이다.
 */
export const useLedgerListQuery = (params: LedgerListParams) => {
  return useQuery<PageResponse<LedgerEntry>, AppError>({
    queryKey: ["get-ledger-list", params],
    queryFn: () => getLedgerList(params),
  });
};
