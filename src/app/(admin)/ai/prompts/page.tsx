import PageHeader from "@/components/layout/PageHeader";
import SystemPromptManager from "./_components/SystemPromptManager";

export default function SystemPromptPage() {
  return (
    <>
      <PageHeader
        title="시스템 프롬프트"
        description="시스템 프롬프트 버전을 관리하고 활성 버전을 지정합니다."
      />

      <SystemPromptManager />
    </>
  );
}
