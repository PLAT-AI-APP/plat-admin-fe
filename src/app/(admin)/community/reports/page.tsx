import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ReportManager from "./_components/ReportManager";

export default function ReportPage() {
  return (
    <>
      <PageHeader
        title="신고 관리"
        description="캐릭터·댓글·유저에 접수된 신고를 확인하고 처리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <ReportManager />
      </Suspense>
    </>
  );
}
