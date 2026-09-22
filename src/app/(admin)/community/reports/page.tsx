import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ReportManager from "./_components/ReportManager";

export default function ReportPage() {
  return (
    <>
      <PageHeader
        title="신고 관리"
        description="댓글 · 세계관에 접수된 신고를 대상별 케이스로 묶어 판정하고 조치합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <ReportManager />
      </Suspense>
    </>
  );
}
