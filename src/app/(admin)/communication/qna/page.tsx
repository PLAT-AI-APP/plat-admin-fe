import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import QnaManager from "./_components/QnaManager";

export default function QnaPage() {
  return (
    <>
      <PageHeader
        title="Q&A 관리"
        description="접수된 문의를 확인하고 답변합니다."
      />

      {/*
        문의는 현재 다른 채널로 받고 있다. 화면을 지우지 않고 MOCK으로 남겨 두는
        이유는, 문의 접수를 앱으로 옮길 때 그대로 쓰게 될 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기 보이는 문의는 <b>목업 데이터</b>입니다. 이 화면에서 남긴 답변은 유저에게
        전달되지 않습니다. 문의 API가 붙는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <QnaManager />
    </>
  );
}
