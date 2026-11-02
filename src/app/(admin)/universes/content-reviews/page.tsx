import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import ReviewMonitorBoard from "./_components/ReviewMonitorBoard";

/**
 * 검수 관제. 세계관 · 이미지 AI 검수의 워커 · 대기열 · 실행 슬롯 · 실패를 보고,
 * AI 가 확정하지 못한 건을 사람이 판정한다. 기본 탭은 관리자 확인이 필요한 건이다.
 */
export default function ContentReviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
      <ReviewMonitorBoard />
    </Suspense>
  );
}
