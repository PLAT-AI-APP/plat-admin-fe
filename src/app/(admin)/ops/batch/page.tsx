import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import BatchManager from "./_components/BatchManager";

export default function BatchPage() {
  return (
    <>
      <PageHeader
        title="배치 관리"
        description="예약 실행 잡이 제대로 돌았는지 확인하고, 실패한 잡을 다시 실행합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <BatchManager />
      </Suspense>
    </>
  );
}
