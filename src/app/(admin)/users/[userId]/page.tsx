import UserDetailView from "./_components/UserDetailView";

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  return <UserDetailView userId={Number(userId)} />;
}
