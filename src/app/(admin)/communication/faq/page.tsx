import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import FaqManager from "./_components/FaqManager";

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="FAQ 관리"
        description="고객센터의 자주 하는 질문을 등록하고 노출 여부를 관리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <FaqManager />
      </Suspense>
    </>
  );
}
