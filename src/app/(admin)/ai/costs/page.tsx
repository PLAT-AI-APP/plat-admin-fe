import PageHeader from "@/components/layout/PageHeader";
import AiCostManager from "./_components/AiCostManager";

export default function AiCostPage() {
  return (
    <>
      <PageHeader
        title="AI 원가"
        description="제공사 원가와 크레딧 매출을 맞대어 봅니다."
      />

      <AiCostManager />
    </>
  );
}
