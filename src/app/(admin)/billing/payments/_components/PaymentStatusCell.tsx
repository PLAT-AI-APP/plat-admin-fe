import type { PaymentOrderListItem } from "@/type/billing";
import { formatCredit } from "@/lib/utils";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import {
  PAYMENT_ANOMALY_LABEL,
  PAYMENT_ANOMALY_ORDER,
} from "@/constants/billingOptions";

type StatusSource = Pick<
  PaymentOrderListItem,
  "paymentStatus" | "fulfillmentStatus" | "refundStatus" | "openAnomalyTypes"
> &
  Partial<
    Pick<PaymentOrderListItem, "refundCreditUsedSinceRequest" | "refundChatInProgress">
  >;

interface DisplayStatus {
  label: string;
  tone: BadgeTone;
}

/**
 * 결제 한 건의 상태를 **한 단어로** 합친다.
 *
 * 서버는 돈 · 노트 · 환불 요청 · 이상을 네 축으로 따로 들고 있다. 그래야 "승인됐는데
 * 미지급" 같은 상태를 표현할 수 있다. 하지만 화면이 네 축을 다 늘어놓으면 운영자가
 * 머릿속에서 다시 합쳐야 한다. 그래서 보여 줄 것은 하나로 고르고, 우선순위는
 * **지금 사람이 봐야 하는 것부터**다.
 *
 * 1. 열린 이상 — 빨강. 여러 개면 가장 급한 것 하나와 나머지 개수
 * 2. 진행 중인 환불 — 대기 · 처리 중
 * 3. 돈과 노트를 합친 결과
 *
 * 거절된 환불은 결제에 흔적을 남기지 않는다. 결제는 그대로 결제 완료이고, 거절 이력은 상세에 있다.
 */
export const getPaymentDisplayStatus = (order: StatusSource): DisplayStatus => {
  const anomalies = PAYMENT_ANOMALY_ORDER.filter((type) =>
    order.openAnomalyTypes.includes(type),
  );

  if (anomalies.length > 0) {
    const rest = anomalies.length - 1;

    return {
      label: `${PAYMENT_ANOMALY_LABEL[anomalies[0]]}${rest > 0 ? ` 외 ${rest}` : ""}`,
      tone: "danger",
    };
  }

  if (order.refundStatus === "REQUESTED") return { label: "환불 대기", tone: "warning" };
  if (order.refundStatus === "PROCESSING") return { label: "환불 처리 중", tone: "info" };

  switch (order.paymentStatus) {
    case "PENDING":
      return { label: "결제 대기", tone: "neutral" };
    case "IN_DOUBT":
      return { label: "승인 확인 중", tone: "warning" };
    case "CAPTURED":
      return order.fulfillmentStatus === "GRANTED"
        ? { label: "결제 완료", tone: "success" }
        : { label: "지급 대기", tone: "warning" };
    case "PARTIALLY_REFUNDED":
      return { label: "부분 환불", tone: "info" };
    case "REFUNDED":
      return { label: "환불 완료", tone: "neutral" };
    case "FAILED":
      return { label: "결제 실패", tone: "neutral" };
    case "CANCELLED":
      return { label: "취소", tone: "neutral" };
    case "EXPIRED":
      return { label: "만료", tone: "neutral" };
  }
};

interface PaymentStatusCellProps {
  order: StatusSource;
}

/**
 * 결제 상태 배지. 목록 · 상세가 같은 한 단어를 쓴다.
 *
 * 환불 대기에만 **승인 판단에 필요한 한 줄**을 배지 밑에 붙인다. 신청 뒤 노트를 썼으면
 * 승인할 수 없는데, 이걸 상세를 열어야 알면 대기 건을 훑다가 그대로 승인하게 된다.
 * 배지를 하나 더 붙이지 않고 글자로 둔다 — 상태는 여전히 하나다.
 */
const PaymentStatusCell = ({ order }: PaymentStatusCellProps) => {
  const { label, tone } = getPaymentDisplayStatus(order);
  const isPendingRefund = label === "환불 대기";
  const used = order.refundCreditUsedSinceRequest ?? 0;

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={tone}>{label}</Badge>
      {isPendingRefund && used > 0 && (
        <span className="body-6 font-medium text-danger">
          신청 후 {formatCredit(used)} 사용 · 승인 불가
        </span>
      )}
      {isPendingRefund && used === 0 && order.refundChatInProgress && (
        <span className="body-6 text-warning">채팅 진행 중 · 승인 대기</span>
      )}
    </div>
  );
};

export default PaymentStatusCell;
