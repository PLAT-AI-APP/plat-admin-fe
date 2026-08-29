import UserDetailView from "./_components/UserDetailView";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  /* Snowflake ID 라 숫자로 바꾸지 않는다. 바꾸면 끝자리가 뭉갠다. */
  return <UserDetailView userId={userId} />;
}
