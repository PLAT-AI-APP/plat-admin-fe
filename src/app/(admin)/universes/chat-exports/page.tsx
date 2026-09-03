import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import ChatExportManager from "./_components/ChatExportManager";

export default function ChatExportPage() {
  return (
    <>
      <PageHeader
        title="채팅 내보내기"
        description="운영 확인이 필요한 대화 기록을 추출합니다."
      />

      {/*
        대화 추출은 현재 직접 조회로 처리한다. 화면을 지우지 않고 MOCK으로 남겨 두는
        이유는, 신고 대응에서 결국 운영자가 직접 뽑아야 할 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기서 요청한 추출은 <b>목업 데이터에만</b> 남고 실제 대화 기록이 만들어지지
        않습니다. 추출 API가 붙는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <ChatExportManager />
    </>
  );
}
