"use client";

import { usePaymentRecordSummaryQuery } from "@/api/billing/getPaymentRecordSummary";
import { formatCurrency, formatWithCommas } from "@/lib/utils";
import type { PaymentRecordSummary } from "@/type/billing";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { EXPIRING_DAYS, RETENTION_YEARS } from "./recordOptions";

interface SummaryItem {
  key: keyof PaymentRecordSummary;
  label: string;
  description: string;
  format: (value: number) => string;
  /** 주의해서 봐야 하는 지표. 파기 예정 건은 넘기면 보존 의무 위반이 된다. */
  isAlert?: boolean;
}

const countOf = (value: number) => `${formatWithCommas(value)}건`;

const SUMMARY_ITEMS: SummaryItem[] = [
  {
    key: "totalCount",
    label: "보존 중인 원장",
    description: `결제일로부터 ${RETENTION_YEARS}년간 보관`,
    format: countOf,
  },
  {
    key: "withdrawnCount",
    label: "탈퇴 회원 건",
    description: "개인정보는 파기되고 거래 기록만 남음",
    format: countOf,
  },
  {
    key: "expiringCount",
    label: "보존 만료 임박",
    description: `${EXPIRING_DAYS}일 내 파기 대상`,
    format: countOf,
    isAlert: true,
  },
  {
    key: "netApprovedAmount",
    label: "순 승인금액",
    description: "취소 · 환불을 뺀 누적 금액",
    format: formatCurrency,
  },
];

/** 보존 원장 상단 지표. 기간 필터와 무관하게 전체 누적값을 보여 준다. */
const PaymentRecordSummaryCards = () => {
  const { data, isLoading } = usePaymentRecordSummaryQuery();

  return (
    <div className="grid grid-cols-4 gap-4">
      {SUMMARY_ITEMS.map(({ key, label, description, format, isAlert }) => (
        <Card key={key} bodyClassName="p-4">
          <p className="body-5 text-font-2">{label}</p>

          {isLoading || !data ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p
              className={
                isAlert && data[key] > 0
                  ? "mt-2 truncate heading-1 font-bold text-warning tabular-nums"
                  : "mt-2 truncate heading-1 font-bold text-font-0 tabular-nums"
              }
            >
              {format(data[key])}
            </p>
          )}

          <p className="mt-2 body-6 text-font-2">{description}</p>
        </Card>
      ))}
    </div>
  );
};

export default PaymentRecordSummaryCards;
