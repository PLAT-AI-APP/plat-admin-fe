import PageHeader from "@/components/layout/PageHeader";
import CreditPolicyManager from "./_components/CreditPolicyManager";

export default function CreditPolicyPage() {
  return (
    <>
      <PageHeader
        title="크레딧 정책 관리"
        description="크레딧 지급·차감 정책을 관리합니다."
      />

      <CreditPolicyManager />
    </>
  );
}
