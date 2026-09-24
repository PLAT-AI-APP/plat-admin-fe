import PageHeader from "@/components/layout/PageHeader";
import EarningPolicyManager from "./_components/EarningPolicyManager";

export default function EarningPolicyPage() {
  return (
    <>
      <PageHeader
        title="수익 정책 · 교환 상품"
        description="배분 비율과 노트 기준가를 바꾸면 바로 다음 적립부터 적용됩니다. 이미 쌓인 적립은 당시 값이 그대로 남습니다."
      />
      <EarningPolicyManager />
    </>
  );
}
