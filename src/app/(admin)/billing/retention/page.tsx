import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import PaymentRecordManager from "./_components/PaymentRecordManager";

export default function PaymentRetentionPage() {
  return (
    <>
      <PageHeader
        title="결제 보존 원장"
        description="탈퇴 · 파기 이후에도 법정 기간 동안 남기는 결제 기록입니다. 결제사 거래번호로 조회합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <PaymentRecordManager />
      </Suspense>
    </>
  );
}
