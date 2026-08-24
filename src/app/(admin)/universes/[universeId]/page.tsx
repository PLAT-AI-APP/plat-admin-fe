import UniverseDetailView from "./_components/UniverseDetailView";

interface UniverseDetailPageProps {
  params: Promise<{ universeId: string }>;
}

export default async function UniverseDetailPage({
  params,
}: UniverseDetailPageProps) {
  const { universeId } = await params;

  // Snowflake ID는 크므로 Number로 바꾸지 않고 문자열 그대로 넘긴다(정밀도 손실 방지).
  return <UniverseDetailView universeId={universeId} />;
}
