import type { BadgeTone } from "@/components/ui/Badge";
import { formatWithCommas } from "@/lib/utils";
import type { EarningLedgerRow, RewardDeliveryChannel, RewardRedemptionStatus } from "@/type/earning";

/** 수익 포인트 표기. 적립 금액처럼 소수가 있으면 넷째 자리까지 보인다. */
export const formatPoint = (value: number) =>
  `${Number.isInteger(value) ? formatWithCommas(value) : value.toLocaleString(undefined, { maximumFractionDigits: 4 })}P`;

export const REDEMPTION_STATUS: Record<RewardRedemptionStatus, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: "발송 대기", tone: "warning" },
  GRANTING: { label: "노트 지급 중", tone: "warning" },
  ISSUED: { label: "완료", tone: "success" },
  REJECTED: { label: "반려", tone: "danger" },
};

export const ledgerTone = (row: EarningLedgerRow): BadgeTone =>
  row.type === "ADMIN_DEDUCT" || row.type === "WITHDRAW_FORFEIT"
    ? "danger"
    : row.amount > 0
      ? "success"
      : "neutral";

export const DELIVERY_CHANNEL_LABEL: Record<RewardDeliveryChannel, string> = {
  SMS: "문자",
  EMAIL: "이메일",
  KAKAO_ALIMTALK: "알림톡",
};

/** 받는 곳 원문은 목록의 "보기"로만 연다. 처리 내역에는 가린 값만 싣는다. */
export const maskRecipient = (recipient: string, channel?: RewardDeliveryChannel) => {
  if (channel === "EMAIL") {
    const at = recipient.indexOf("@");
    return at < 0 ? "***" : `${recipient.slice(0, Math.min(2, at))}***${recipient.slice(at)}`;
  }
  return recipient.replace(/^(\d{3})-?(\d{3,4})-?(\d{4})$/, "$1-****-$3");
};
