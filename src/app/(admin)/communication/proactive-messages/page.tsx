import PageHeader from "@/components/layout/PageHeader";
import ProactiveMessageManager from "./_components/ProactiveMessageManager";

export default function ProactiveMessagePage() {
  return (
    <>
      <PageHeader
        title="선제 메시지"
        description="캐릭터가 먼저 보내는 메시지를 관리합니다."
      />

      <ProactiveMessageManager />
    </>
  );
}
