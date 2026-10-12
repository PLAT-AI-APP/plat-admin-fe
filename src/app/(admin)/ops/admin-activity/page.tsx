import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import AdminActivityManager from "./_components/AdminActivityManager";

export default function AdminActivityPage() {
  return (
    <>
      <PageHeader
        title="운영자 활동 기록"
        description="운영자가 무엇을 어떤 값으로 바꿨는지 봅니다. 변경 값이 그대로 남습니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <AdminActivityManager />
      </Suspense>
    </>
  );
}
