import PageHeader from "@/components/layout/PageHeader";
import DashboardOverview from "./_components/DashboardOverview";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="대시보드"
        description="서비스 상태, 유저, 세계관, 결제, 크레딧 현황을 한 화면에서 확인합니다."
      />

      <DashboardOverview />
    </>
  );
}
