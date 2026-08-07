import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ScenarioBoard from "./_components/ScenarioBoard";

export default function ScenarioPage() {
  return (
    <>
      <PageHeader
        title="세계관"
        description="캐릭터에 등록된 세계관을 조회합니다. 메인 노출 큐레이션의 후보 목록입니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <ScenarioBoard />
      </Suspense>
    </>
  );
}
