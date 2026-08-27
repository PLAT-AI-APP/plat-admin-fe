import PageHeader from "@/components/layout/PageHeader";
import CreditPolicyManager from "./_components/CreditPolicyManager";

export default function CreditPolicyPage() {
  return (
    <>
      <PageHeader
        title="크레딧 정책 관리"
        description="금액이 고정된 크레딧 지급·차감 정책을 관리합니다. 모델별 사용 차감은 AI 모델 설정에서 관리합니다."
      />

      <CreditPolicyManager />
    </>
  );
}
