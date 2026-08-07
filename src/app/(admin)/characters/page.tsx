import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import CharacterManager from "./_components/CharacterManager";

export default function CharacterListPage() {
  return (
    <>
      <PageHeader
        title="전체 캐릭터"
        description="일반 캐릭터를 검색하고 노출 상태를 관리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <CharacterManager />
      </Suspense>
    </>
  );
}
