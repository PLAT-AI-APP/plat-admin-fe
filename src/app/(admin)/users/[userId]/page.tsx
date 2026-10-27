import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import UserDetailView from "./_components/UserDetailView";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  /* Snowflake ID 라 숫자로 바꾸지 않는다. 바꾸면 끝자리가 뭉갠다. */
  /* 탭을 주소(`?tab=`)에서 읽으므로 useSearchParams 경계가 필요하다. */
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
      <UserDetailView userId={userId} />
    </Suspense>
  );
}
