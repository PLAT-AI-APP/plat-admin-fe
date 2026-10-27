import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import LogManager from "./_components/LogManager";

export default function LogPage() {
  return (
    <>
      <PageHeader
        title="시스템 로그"
        description="서버가 받은 요청과 시스템이 남긴 경고를 나눠서 봅니다. 운영자가 바꾼 것은 관리 > 운영자 활동 기록에서 봅니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <LogManager />
      </Suspense>
    </>
  );
}
