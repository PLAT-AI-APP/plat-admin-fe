import { useQuery } from "@tanstack/react-query";
import { liveAxios } from "..";
import {
  toPageResponse,
  type AppError,
  type PageResponse,
  type PageWith,
} from "@/type/api";
import type { AdjustmentType, CreditAdjustment } from "@/type/billing";

export interface CreditAdjustmentListParams {
  page: number;
  size: number;
  keyword?: string;
  type?: AdjustmentType | "";
  /** 특정 유저의 조정 이력만 조회한다. (유저 상세에서 사용) */
  userId?: string;
}

/** 서버 목록 항목. 유저 ID는 Snowflake라 문자열로 내려온다. */
interface CreditAdjustmentResponse {
  adjustmentId: number;
  userId: string;
  userNickname: string | null;
  type: AdjustmentType;
  amount: number;
  reason: string;
  balanceAfter: number;
  processedBy: string;
  processedById: number | null;
  createdAt: string;
}

/**
 * 닉네임이 비어 있는 줄이 있을 수 있다.
 *
 * 조정 이력은 유저 ID만 들고 있고 닉네임은 조회 시점에 붙인다. 유저가 사라진
 * 극단적인 경우에도 조정 기록 자체는 남아야 하므로, 그 자리는 ID로 채운다.
 */
const toCreditAdjustment = (
  adjustment: CreditAdjustmentResponse,
): CreditAdjustment => ({
  ...adjustment,
  userNickname: adjustment.userNickname ?? `#${adjustment.userId}`,
  processedById: adjustment.processedById ?? undefined,
});

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: CreditAdjustmentListParams) => ({
  page: Math.max(params.page - 1, 0),
  size: params.size,
  keyword: params.keyword?.trim() || undefined,
  type: params.type || undefined,
  userId: params.userId || undefined,
});

export const getCreditAdjustmentList = async (
  params: CreditAdjustmentListParams,
): Promise<PageResponse<CreditAdjustment>> => {
  const response = await liveAxios.get<PageWith<CreditAdjustmentResponse>>(
    "/admin/credits/adjustments",
    { params: toRequestParams(params) },
  );

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toCreditAdjustment),
  });
};

/**
 * 크레딧 수동 조정 이력.
 *
 * 결제 장부와 겹쳐 보이지만 답하는 질문이 다르다. 장부는 "이 유저의 크레딧이
 * 어떻게 움직였나"를, 이쪽은 **"운영자가 언제 누구에게 무엇을 왜 했나"**를
 * 답한다. 그래서 여기에만 처리자가 있다.
 *
 * 검색어는 사유·대상 유저 닉네임·유저 ID를 함께 본다. 사유까지 보는 이유는
 * 티켓 번호로 되짚는 경우가 잦아서다. 정렬은 서버가 최근순으로 고정한다.
 */
export const useCreditAdjustmentListQuery = (
  params: CreditAdjustmentListParams,
) => {
  return useQuery<PageResponse<CreditAdjustment>, AppError>({
    queryKey: ["get-credit-adjustment-list", params],
    queryFn: () => getCreditAdjustmentList(params),
  });
};
