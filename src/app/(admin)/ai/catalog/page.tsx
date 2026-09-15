import PageHeader from "@/components/layout/PageHeader";
import ModelCatalogManager from "./_components/ModelCatalogManager";

export default function ModelCatalogPage() {
  return (
    <>
      <PageHeader
        title="모델 카탈로그"
        description="사용 가능한 AI 모델을 확인하고 테스트 호출합니다."
      />

      <ModelCatalogManager />
    </>
  );
}
