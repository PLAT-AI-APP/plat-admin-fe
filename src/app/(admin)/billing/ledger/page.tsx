import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import LedgerManager from "./_components/LedgerManager";

export default function LedgerPage() {
  return (
    <>
      <PageHeader
        title="결제 장부"
        description="결제, 충전, 사용, 환불 흐름을 조회합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <LedgerManager />
      </Suspense>
    </>
  );
}
