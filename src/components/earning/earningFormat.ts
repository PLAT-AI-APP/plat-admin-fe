import type { BadgeTone } from "@/components/ui/Badge";
import { formatWithCommas } from "@/lib/utils";
import type { EarningLedgerRow, RewardRedemptionStatus } from "@/type/earning";

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

/** 번호 원문은 목록의 "보기"로만 연다. 처리 내역에는 가린 값만 싣는다. */
export const maskPhone = (phone: string) =>
  phone.replace(/^(\d{3})-?(\d{3,4})-?(\d{4})$/, "$1-****-$3");
