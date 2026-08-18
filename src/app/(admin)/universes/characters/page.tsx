import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import CharacterManager from "./_components/CharacterManager";

export default function CharacterListPage() {
  return (
    <>
      <PageHeader
        title="캐릭터"
        description="세계관에 등장하는 캐릭터를 검색하고 노출 상태를 관리합니다. 한 캐릭터가 여러 세계관에 등장할 수 있습니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <CharacterManager />
      </Suspense>
    </>
  );
}
