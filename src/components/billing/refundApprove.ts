import {
  PAYMENT_PG_PROVIDER_LABEL,
  REFUND_CHAT_IN_PROGRESS_CODE,
  REFUND_CHAT_IN_PROGRESS_MESSAGE,
} from "@/constants/billingOptions";
import { formatCredit, formatCurrency } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { AppError } from "@/type/api";
import type { PaymentPgProvider } from "@/type/billing";

export interface RefundApproveTarget {
  refundAmount: number;
  refundCredit: number;
  productName?: string;
  pgProvider?: PaymentPgProvider;
  nickname?: string;
  /**
   * 신청 뒤 그 결제의 노트가 쓰였는지. 쓰였으면 승인해도 서버가 '크레딧 사용'으로 자동 거절한다.
   * 모르면(`undefined`) 결제 상세에서 확인하라고 적는다 — 모르는 것을 "안 썼다"로 말하지 않는다.
   */
  creditUsedSinceRequest?: boolean;
  /** 화면마다 덧붙일 말. Q&A 는 "결과는 답변으로 알려 주세요"를 붙인다. */
  note?: string;
}

/**
 * 환불 승인 확인 문구. **결제 상세와 Q&A 가 같은 문구를 쓴다.**
 *
 * 두 곳이 따로 쓰면 한쪽만 경고(신청 뒤 노트 사용)를 빠뜨린다. 실제로 Q&A 쪽은 그 경고 없이
 * "승인하면 돈이 나간다"고만 적어, 자동 거절될 건을 승인하는 줄 모르고 눌렀다.
 */
export const buildRefundApproveMessage = (target: RefundApproveTarget) => {
  const via = target.pgProvider
    ? `${PAYMENT_PG_PROVIDER_LABEL[target.pgProvider]}로 `
    : "";
  const whose = target.nickname ? `'${target.nickname}' 님의 ` : "";
  const product = target.productName ? `${target.productName} · ` : "";

  const usage =
    target.creditUsedSinceRequest === true
      ? "신청 뒤 유저가 노트를 사용했습니다. 승인하면 크레딧 사용으로 자동 거절됩니다."
      : target.creditUsedSinceRequest === false
        ? "승인하면 PG로 돈이 나가며 되돌릴 수 없습니다."
        : "승인하면 PG로 돈이 나가며 되돌릴 수 없습니다. 신청 뒤 노트를 썼다면 자동 거절되니, 결제 상세에서 사용 여부를 먼저 확인해 주세요.";

  return {
    title: "환불을 승인할까요?",
    description: `${product}${via}${formatCurrency(target.refundAmount)}을 취소하고, ${whose}노트 ${formatCredit(target.refundCredit)}를 회수합니다.`,
    warning: target.note ? `${usage} ${target.note}` : usage,
  };
};

/**
 * 환불 승인 확인을 연다. 채팅이 크레딧을 예약 중이라 막힌 경우는 서버 코드 대신 할 일을 알려 준다.
 */
export const openRefundApproveConfirm = (
  target: RefundApproveTarget,
  approve: () => Promise<unknown>,
  onSettled?: () => void,
) => {
  openConfirm({
    ...buildRefundApproveMessage(target),
    confirmText: "승인",
    tone: "danger",
    onConfirm: async () => {
      try {
        await approve();
      } catch (caught) {
        if ((caught as AppError).code === REFUND_CHAT_IN_PROGRESS_CODE) {
          throw new Error(REFUND_CHAT_IN_PROGRESS_MESSAGE);
        }

        throw caught;
      } finally {
        onSettled?.();
      }
    },
  });
};
