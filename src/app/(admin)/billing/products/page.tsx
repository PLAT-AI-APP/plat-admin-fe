import PageHeader from "@/components/layout/PageHeader";
import BillingProductManager from "./_components/BillingProductManager";

export default function BillingProductPage() {
  return (
    <>
      <PageHeader
        title="상품/결제금액 관리"
        description="크레딧 상품과 결제 금액을 관리합니다."
      />

      <BillingProductManager />
    </>
  );
}
