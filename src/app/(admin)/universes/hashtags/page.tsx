import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import HashtagManager from "./_components/HashtagManager";

export default function HashtagPage() {
  return (
    <>
      <PageHeader
        title="해시태그 관리"
        description="사용자가 캐릭터·세계관에 붙일 수 있는 해시태그를 관리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <HashtagManager />
      </Suspense>
    </>
  );
}
