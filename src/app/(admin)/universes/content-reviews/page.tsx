import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ContentReviewManager from "./_components/ContentReviewManager";
import ReviewSettingsCard from "./_components/ReviewSettingsCard";

/**
 * 콘텐츠 검수. 세계관 · 이미지 AI 검수의 진행 상태와 반려 사유를 보고, 동시 검수 수를 정한다.
 * 기본 탭은 관리자 확인이 필요한 건이다.
 */
export default function ContentReviewPage() {
  return (
    <>
      <PageHeader
        title="콘텐츠 검수"
        description="세계관 · 이미지 AI 검수 상태를 확인합니다. 관리자 확인이 필요한 건과 반려 사유를 보고, 동시에 검수할 수를 정합니다."
      />

      <div className="flex flex-col gap-4">
        <ReviewSettingsCard />
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
          <ContentReviewManager />
        </Suspense>
      </div>
    </>
  );
}
