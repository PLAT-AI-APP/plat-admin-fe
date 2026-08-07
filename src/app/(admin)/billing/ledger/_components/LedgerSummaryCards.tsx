"use client";

import { useLedgerSummaryQuery } from "@/api/billing/getLedgerSummary";
import { formatCredit, formatCurrency } from "@/lib/utils";
import type { LedgerSummary } from "@/type/billing";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

interface SummaryItem {
  key: keyof LedgerSummary;
  label: string;
  description: string;
  /** 금액은 formatCurrency, 크레딧은 formatCredit으로 단위를 고정한다. */
  format: (value: number) => string;
}

const SUMMARY_ITEMS: SummaryItem[] = [
  {
    key: "totalPaidAmount",
    label: "누적 결제금액",
    description: "결제 완료 건 합계",
    format: formatCurrency,
  },
  {
    key: "totalRefundAmount",
    label: "환불금액",
    description: "환불 처리 건 합계",
    format: formatCurrency,
  },
  {
    key: "totalChargedCredit",
    label: "충전 크레딧",
    description: "증가한 크레딧 합계",
    format: formatCredit,
  },
  {
    key: "totalUsedCredit",
    label: "사용 크레딧",
    description: "감소한 크레딧 합계",
    format: formatCredit,
  },
];

/** 장부 상단 누적 지표. 기간 필터와 무관하게 전체 누적값을 보여 준다. */
const LedgerSummaryCards = () => {
  const { data, isLoading } = useLedgerSummaryQuery();

  return (
    <div className="grid grid-cols-4 gap-4">
      {SUMMARY_ITEMS.map(({ key, label, description, format }) => (
        <Card key={key} bodyClassName="p-4">
          <p className="text-[13px] text-font-2">{label}</p>

          {isLoading || !data ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-2 truncate text-[26px] font-bold text-font-0 tabular-nums">
              {format(data[key])}
            </p>
          )}

          <p className="mt-2 text-[12px] text-font-2">{description}</p>
        </Card>
      ))}
    </div>
  );
};

export default LedgerSummaryCards;
