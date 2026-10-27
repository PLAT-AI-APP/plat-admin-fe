import CreatorEarningDetail from "./_components/CreatorEarningDetail";

interface CreatorEarningDetailPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function CreatorEarningDetailPage({
  params,
}: CreatorEarningDetailPageProps) {
  const { accountId } = await params;
  return <CreatorEarningDetail accountId={accountId} />;
}
