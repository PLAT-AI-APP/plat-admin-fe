import PageHeader from "@/components/layout/PageHeader";
import AiCostManager from "./_components/AiCostManager";

export default function AiCostPage() {
  return (
    <>
      <PageHeader
        title="AI 원가·매출"
        description="제공사 원가와 노트 매출을 맞대어 봅니다."
      />

      <AiCostManager />
    </>
  );
}
