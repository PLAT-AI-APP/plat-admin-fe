import PageHeader from "@/components/layout/PageHeader";
import ChatExportManager from "./_components/ChatExportManager";

export default function ChatExportPage() {
  return (
    <>
      <PageHeader
        title="채팅 내보내기"
        description="운영 확인이 필요한 대화 기록을 추출합니다."
      />

      <ChatExportManager />
    </>
  );
}
