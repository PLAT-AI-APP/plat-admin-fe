import type { BadgeTone } from "@/components/ui/Badge";
import type { QnaRefundLink } from "@/type/communication";

/**
 * 환불 문의에 묶인 환불 상태의 관리자용 표기.
 *
 * 결제 도메인의 원본 값(status · creditRestored)을 관리자가 읽는 말로 바꾼다.
 * `FAILED`는 노트를 되돌렸는지에 따라 뜻이 갈린다 — 되돌렸으면 "환불 불가"로 확정된 결과이고,
 * 아니면 결제 상세에서 마무리할 일이 남은 상태다. 목록 · 상세가 같은 말을 쓰도록 여기 한 곳에 둔다.
 */
export interface RefundResultView {
  label: string;
  tone: BadgeTone;
}

export const getRefundResult = (
  refund: Pick<QnaRefundLink, "status" | "creditRestored">,
): RefundResultView => {
  switch (refund.status) {
    case "REQUESTED":
      return { label: "승인 대기", tone: "warning" };
    case "PROCESSING":
      return { label: "PG 결과 대기", tone: "info" };
    case "FAILED":
      return refund.creditRestored
        ? { label: "환불 불가 · 노트 되돌림", tone: "neutral" }
        : { label: "PG 실패 · 결제 상세에서 마무리 필요", tone: "danger" };
    case "COMPLETED":
      return { label: "환불 완료", tone: "success" };
    case "REJECTED":
      return { label: "환불 거절", tone: "neutral" };
  }
};
