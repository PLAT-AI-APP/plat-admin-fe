import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import UniverseBoard from "./_components/UniverseBoard";

export default function UniversePage() {
  return (
    <>
      <PageHeader
        title="전체 세계관"
        description="세계관을 조회합니다. 세계관 하나에 캐릭터와 시나리오가 담깁니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <UniverseBoard />
      </Suspense>
    </>
  );
}
