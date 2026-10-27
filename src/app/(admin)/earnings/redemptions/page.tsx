import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import RedemptionManager from "./_components/RedemptionManager";

export default function RedemptionPage() {
  return (
    <>
      <PageHeader
        title="교환 요청"
        description="상품권 교환 신청을 확인하고 수동 발송 후 완료 처리합니다. 노트 교환은 즉시 처리되어 기록만 남습니다."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <RedemptionManager />
      </Suspense>
    </>
  );
}
