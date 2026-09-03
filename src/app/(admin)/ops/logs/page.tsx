import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import LogManager from "./_components/LogManager";

export default function LogPage() {
  return (
    <>
      <PageHeader
        title="로그"
        description="관리자가 바꾼 것과 시스템이 남긴 경고를 나눠서 봅니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <LogManager />
      </Suspense>
    </>
  );
}
