import type { LedgerType } from "@/type/billing";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

/** 장부 유형 표기 — 화면에는 원문 enum 대신 이 라벨만 노출한다. */
export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  PAYMENT: "결제",
  CHARGE: "충전",
  USE: "사용",
  REFUND: "환불",
  ADJUSTMENT: "수동 조정",
};

export const LEDGER_TYPE_TONE: Record<LedgerType, BadgeTone> = {
  PAYMENT: "brand",
  CHARGE: "info",
  USE: "neutral",
  REFUND: "danger",
  ADJUSTMENT: "warning",
};

/** 목록 필터용. 전체 조회는 빈 값으로 보낸다. */
export const LEDGER_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 유형", value: "" },
  ...(Object.keys(LEDGER_TYPE_LABEL) as LedgerType[]).map((type) => ({
    label: LEDGER_TYPE_LABEL[type],
    value: type,
  })),
];
