import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import HashtagWorkspace from "./_components/HashtagWorkspace";

export default function HashtagPage() {
  return (
    <>
      <PageHeader
        title="해시태그"
        description="유저가 캐릭터·세계관에 붙일 수 있는 해시태그를 관리하고, 유저가 보낸 태그 제안을 확인합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <HashtagWorkspace />
      </Suspense>
    </>
  );
}
