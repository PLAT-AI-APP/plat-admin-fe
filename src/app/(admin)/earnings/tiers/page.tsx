import PageHeader from "@/components/layout/PageHeader";
import TierDefinitionManager from "./_components/TierDefinitionManager";

export default function CreatorTierPage() {
  return (
    <>
      <PageHeader
        title="제작자 등급"
        description="등급별 승급 조건과 그 밖의 혜택을 관리합니다. 제작자별 등급은 유저 상세의 크리에이터 탭에서 봅니다."
      />
      <TierDefinitionManager />
    </>
  );
}
