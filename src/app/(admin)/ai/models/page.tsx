import PageHeader from "@/components/layout/PageHeader";
import AiModelManager from "./_components/AiModelManager";

export default function AiModelPage() {
  return (
    <>
      <PageHeader
        title="AI 모델 관리"
        description="모델 사용 여부와 역할 지정, 운영 메타 정보를 관리합니다."
      />

      <AiModelManager />
    </>
  );
}
