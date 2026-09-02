import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import DashboardOverview from "./_components/DashboardOverview";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="대시보드"
        description="서비스 상태, 유저, 세계관, 결제, 크레딧 현황을 한 화면에서 확인합니다."
      />

      {/*
        집계 지표를 아직 실서버가 내려주지 않는다. 화면을 지우지 않고 MOCK으로 남겨 두는
        이유는, 지표가 붙는 대로 그대로 켜면 되는 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기 숫자와 추이는 <b>목업 데이터</b>입니다. 실제 서비스 지표가 아니므로 운영
        판단의 근거로 쓰지 마세요. 집계 API가 붙는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <DashboardOverview />
    </>
  );
}
