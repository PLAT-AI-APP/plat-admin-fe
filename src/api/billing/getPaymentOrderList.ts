import { liveAxios } from "..";
import { usePermittedQuery } from "@/api/usePermittedQuery";
import { toPageRequest, toPageResponse, type PageResponse, type PageWith } from "@/type/api";
import type {
  PaymentAnomalyType,
  PaymentOrderListItem,
  PaymentOrderTab,
  PaymentPgProvider,
  PaymentStatus,
} from "@/type/billing";
import { toPaymentOrderListItem } from "./paymentOrderMapper";

export interface PaymentOrderListParams {
  page: number;
  size: number;
  tab: PaymentOrderTab;
  /** 주문번호 · PG 거래번호는 정확히, 닉네임은 부분 일치, 숫자면 유저 ID · 주문 ID */
  keyword?: string;
  pgProvider?: PaymentPgProvider | "";
  paymentStatus?: PaymentStatus | "";
  /** '확인 필요' 안에서 유형으로 좁힌다. */
  anomalyType?: PaymentAnomalyType | "";
  /** 유저 상세에서 넘어온 드릴다운 */
  userId?: string;
  /** 보존 기간. `EXPIRING`이면 만료 90일 이내만 */
  retention?: "EXPIRING" | "";
  /** 주문 생성일 기준. YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
}

/** 화면은 1부터, 서버는 0부터 페이지를 센다. 빈 필터는 서버에 보내지 않는다. */
const toRequestParams = (params: PaymentOrderListParams) => ({
  ...toPageRequest(params),
  tab: params.tab === "ALL" ? undefined : params.tab,
  keyword: params.keyword?.trim() || undefined,
  pgProvider: params.pgProvider || undefined,
  paymentStatus: params.paymentStatus || undefined,
  anomalyType: params.anomalyType || undefined,
  userId: params.userId || undefined,
  retention: params.retention || undefined,
  startDate: params.startDate || undefined,
  endDate: params.endDate || undefined,
});

export const getPaymentOrderList = async (
  params: PaymentOrderListParams,
): Promise<PageResponse<PaymentOrderListItem>> => {
  const response = await liveAxios.get<PageWith<unknown>>("/payment-orders", {
    params: toRequestParams(params),
  });

  return toPageResponse({
    ...response.data,
    content: response.data.content.map(toPaymentOrderListItem),
  });
};

/**
 * 결제 내역.
 *
 * 결제 장부 · 환불 관리 · 보존 원장이 각자 보던 것을 **결제 주문 한 줄**로 모은 목록이다.
 * 탭은 다른 표가 아니라 같은 목록을 좁히는 조건이다.
 */
export const usePaymentOrderListQuery = (params: PaymentOrderListParams) => {
  return usePermittedQuery<PageResponse<PaymentOrderListItem>>("payment:read", {
    queryKey: ["get-payment-order-list", params],
    queryFn: () => getPaymentOrderList(params),
  });
};
