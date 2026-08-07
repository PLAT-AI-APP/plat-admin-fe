import PageHeader from "@/components/layout/PageHeader";
import LedgerManager from "./_components/LedgerManager";

export default function LedgerPage() {
  return (
    <>
      <PageHeader
        title="결제 장부"
        description="결제, 충전, 사용, 환불 흐름을 조회합니다."
      />

      <LedgerManager />
    </>
  );
}
