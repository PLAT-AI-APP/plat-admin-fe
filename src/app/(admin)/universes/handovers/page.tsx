import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import UniverseHandoverManager from "./_components/UniverseHandoverManager";

export default function UniverseHandoverPage() {
  return (
    <>
      <PageHeader
        title="인수 심사"
        description="탈퇴한 제작자가 남긴 캐릭터를 심사합니다. 승인하면 공식 계정이 인수해 운영하고, 반려하면 삭제됩니다. 14일 안에 처리하지 않으면 자동 만료됩니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <UniverseHandoverManager />
      </Suspense>
    </>
  );
}
