import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import NoticeManager from "./_components/NoticeManager";

export default function NoticePage() {
  return (
    <>
      <PageHeader
        title="공지사항 관리"
        description="앱에 노출되는 공지사항을 마크다운으로 작성하고 게시 상태를 관리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <NoticeManager />
      </Suspense>
    </>
  );
}
