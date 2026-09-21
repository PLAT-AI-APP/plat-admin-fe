import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import PaymentOrderManager from "./_components/PaymentOrderManager";

export default function PaymentOrderPage() {
  return (
    <>
      <PageHeader
        title="결제 내역"
        description="결제 한 건의 승인 · 노트 지급 · 환불 · 보존을 한곳에서 봅니다. 노트가 안 나갔거나 환불이 막힌 건은 '확인 필요'에 모입니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <PaymentOrderManager />
      </Suspense>
    </>
  );
}
