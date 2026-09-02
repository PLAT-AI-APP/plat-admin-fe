import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import CreditPolicyManager from "./_components/CreditPolicyManager";

export default function CreditPolicyPage() {
  return (
    <>
      <PageHeader
        title="크레딧 정책 관리"
        description="금액이 고정된 크레딧 지급·차감 정책을 관리합니다. 모델별 사용 차감은 AI 모델 설정에서 관리합니다."
      />

      {/*
        지급·차감 정책을 아직 서버가 이 화면에서 읽어 가지 않는다. 화면을 지우지 않고
        MOCK으로 남겨 두는 이유는, 정책을 코드가 아니라 여기서 바꾸게 될 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기서 저장한 정책은 <b>목업 데이터에만</b> 남고 실제 크레딧 지급·차감으로
        이어지지 않습니다. 정책 API가 붙는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <CreditPolicyManager />
    </>
  );
}
