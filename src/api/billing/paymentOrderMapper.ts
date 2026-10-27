import type {
  PaymentEventTone,
  PaymentOrderDetail,
  PaymentOrderListItem,
} from "@/type/billing";

/**
 * 서버는 비어 있는 값을 `null`로 보내고, 화면 타입은 `undefined`(선택 필드)로 다룬다.
 * 결제 응답은 중첩이 깊어(환불 → 풀 사용 → 원장 줄) 필드마다 옮기면 빠뜨리기 쉬워, 통째로 바꾼다.
 * 환불의 `qnaId`(문의 없이 건 환불은 `null`)도 여기서 `undefined`가 된다.
 */
const withoutNulls = <T>(value: unknown): T => {
  if (value === null) return undefined as T;
  if (Array.isArray(value)) return value.map((item) => withoutNulls(item)) as T;
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        withoutNulls(item),
      ]),
    ) as T;
  }
  return value as T;
};

export const toPaymentOrderListItem = (row: unknown): PaymentOrderListItem =>
  withoutNulls<PaymentOrderListItem>(row);

/** 타임라인 색은 서버가 enum 이름(`SUCCESS`)으로, 화면은 배지 톤(`success`)으로 쓴다. */
export const toPaymentOrderDetail = (response: unknown): PaymentOrderDetail => {
  const detail = withoutNulls<PaymentOrderDetail>(response);
  return {
    ...detail,
    timeline: detail.timeline.map((event) => ({
      ...event,
      tone: String(event.tone).toLowerCase() as PaymentEventTone,
    })),
  };
};
