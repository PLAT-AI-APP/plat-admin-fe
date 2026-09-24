import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import CreatorEarningList from "./_components/CreatorEarningList";

export default function CreatorEarningPage() {
  return (
    <>
      <PageHeader
        title="제작자 수익"
        description="제작자별 수익 포인트 잔액과 적립 현황입니다. 행을 누르면 원장과 조치 이력을 봅니다."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <CreatorEarningList />
      </Suspense>
    </>
  );
}
