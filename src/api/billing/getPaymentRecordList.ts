import { adminAxios } from "..";
import { usePermittedQuery } from "../usePermittedQuery";
import type { PageResponse } from "@/type/api";
import type {
  PaymentRecord,
  PaymentRecordStatus,
  PgProvider,
} from "@/type/billing";

/** 회원 상태 필터. 이 화면의 주 대상은 탈퇴 회원이라 따로 좁힐 수 있어야 한다. */
export type PaymentRecordMemberFilter = "" | "WITHDRAWN" | "ACTIVE";

export interface PaymentRecordListParams {
  page: number;
  size: number;
  /** PG 거래번호 · 주문번호 · 승인번호 · 회원 해시로 찾는다. */
  keyword?: string;
  provider?: PgProvider | "";
  status?: PaymentRecordStatus | "";
  member?: PaymentRecordMemberFilter;
  /** 승인일 기준. YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  /**
   * 이 유저의 보존 원장만 조회한다. (유저 상세에서 사용)
   *
   * **서버가 유저 식별자를 회원 해시로 바꿔서 찾는다.** 원장의 `userId`는 파기와
   * 함께 지워지므로 그 컬럼으로 걸면 파기된 건이 빠진다 — 정작 이 화면에서
   * 놓치면 안 되는 것이 그쪽이다. 해시는 파기 후에도 남으므로 계정이 남아 있는
   * 동안에는 유저에서 원장으로 언제든 건너갈 수 있다.
   */
  userId?: number;
}

export const getPaymentRecordList = async (params: PaymentRecordListParams) => {
  const response = await adminAxios.get<PageResponse<PaymentRecord>>(
    "/admin/payment-records",
    { params },
  );

  return response.data;
};

/**
 * 법정 보존 결제 원장을 결제사 · 상태 · 회원 상태 · 기간 필터와 함께 조회합니다.
 *
 * 원장 전용 화면 밖(유저 상세)에서도 부르므로 **권한 판정을 조회에 붙인다.**
 * 부르는 쪽마다 `enabled`로 막으면 한 곳만 빠뜨려도 권한 없는 운영자에게
 * 누른 적 없는 거부 안내가 뜬다.
 */
export const usePaymentRecordListQuery = (params: PaymentRecordListParams) => {
  return usePermittedQuery<PageResponse<PaymentRecord>>("paymentRecord:read", {
    queryKey: ["get-payment-record-list", params],
    queryFn: () => getPaymentRecordList(params),
  });
};
