import CharacterDetailView from "./_components/CharacterDetailView";

interface CharacterDetailPageProps {
  params: Promise<{ characterId: string }>;
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { characterId } = await params;

  return <CharacterDetailView characterId={Number(characterId)} />;
}
