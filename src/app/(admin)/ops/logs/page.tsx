import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import LogManager from "./_components/LogManager";

export default function LogPage() {
  return (
    <>
      <PageHeader
        title="로그"
        description="누가 무엇을 바꿨는지 확인합니다. 행을 클릭하면 변경 내용이 열립니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <LogManager />
      </Suspense>
    </>
  );
}
