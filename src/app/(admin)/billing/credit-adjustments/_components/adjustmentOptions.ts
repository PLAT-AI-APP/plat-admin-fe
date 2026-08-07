import type { AdjustmentType } from "@/type/billing";
import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";

/** 조정 유형 표기 — 화면에는 원문 enum 대신 이 라벨만 노출한다. */
export const ADJUSTMENT_TYPE_LABEL: Record<AdjustmentType, string> = {
  GRANT: "지급",
  DEDUCT: "차감",
};

export const ADJUSTMENT_TYPE_TONE: Record<AdjustmentType, BadgeTone> = {
  GRANT: "success",
  DEDUCT: "danger",
};

/**
 * 조정 유형별 부호.
 * 표·확인 문구에서 금액 앞에 붙여 지급인지 차감인지 눈으로 먼저 읽게 한다.
 */
export const ADJUSTMENT_TYPE_SIGN: Record<AdjustmentType, string> = {
  GRANT: "+",
  DEDUCT: "-",
};

export const ADJUSTMENT_TYPE_OPTIONS: SelectOption[] = (
  Object.keys(ADJUSTMENT_TYPE_LABEL) as AdjustmentType[]
).map((type) => ({
  label: ADJUSTMENT_TYPE_LABEL[type],
  value: type,
}));

/** 목록 필터용. 전체 조회는 빈 값으로 보낸다. */
export const ADJUSTMENT_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 유형", value: "" },
  ...ADJUSTMENT_TYPE_OPTIONS,
];
