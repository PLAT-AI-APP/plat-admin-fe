import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import QnaManager from "./_components/QnaManager";

export default function QnaPage() {
  return (
    <>
      <PageHeader
        title="Q&A 관리"
        description="접수된 문의를 확인하고 답변합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <QnaManager />
      </Suspense>
    </>
  );
}
