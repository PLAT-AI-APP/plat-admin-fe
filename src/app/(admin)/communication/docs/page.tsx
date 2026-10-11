import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import DocsManager from "./_components/DocsManager";

export default function DocsPage() {
  return (
    <>
      <PageHeader
        title="문서"
        description="사용자 사이트 문서(/docs)의 그룹과 페이지를 마크다운으로 작성하고 게시합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <DocsManager />
      </Suspense>
    </>
  );
}
