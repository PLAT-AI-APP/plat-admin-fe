import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import UserManager from "./_components/UserManager";

export default function UserListPage() {
  return (
    <>
      <PageHeader
        title="유저 관리"
        description="유저를 검색하고 계정 상태와 역할을 관리합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <UserManager />
      </Suspense>
    </>
  );
}
