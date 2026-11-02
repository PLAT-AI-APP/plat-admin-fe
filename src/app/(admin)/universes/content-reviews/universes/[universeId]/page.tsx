import UniverseReviewHistory from "./_components/UniverseReviewHistory";

interface UniverseReviewHistoryPageProps {
  params: Promise<{ universeId: string }>;
}

export default async function UniverseReviewHistoryPage({ params }: UniverseReviewHistoryPageProps) {
  const { universeId } = await params;

  // Snowflake ID는 크므로 Number로 바꾸지 않고 문자열 그대로 넘긴다(정밀도 손실 방지).
  return <UniverseReviewHistory universeId={universeId} />;
}
