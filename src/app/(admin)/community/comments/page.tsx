import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import CommentManager from "./_components/CommentManager";

export default function CommentPage() {
  return (
    <>
      <PageHeader
        title="댓글 관리"
        description="세계관·캐릭터에 달린 댓글을 한 화면에서 확인하고 숨김 처리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <CommentManager />
      </Suspense>
    </>
  );
}
