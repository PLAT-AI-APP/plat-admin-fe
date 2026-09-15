import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import CreditAdjustmentManager from "./_components/CreditAdjustmentManager";

export default function CreditAdjustmentPage() {
  return (
    <>
      <PageHeader
        title="크레딧 수동 조정"
        description="운영자가 크레딧을 수동으로 지급하거나 차감합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <CreditAdjustmentManager />
      </Suspense>
    </>
  );
}
