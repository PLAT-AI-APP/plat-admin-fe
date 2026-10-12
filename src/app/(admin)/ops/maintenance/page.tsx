import PageHeader from "@/components/layout/PageHeader";
import MaintenanceCard from "./_components/MaintenanceCard";

/**
 * 서비스 점검. 서버 상태 화면에서 떼어 냈다 — 기능은 개발이 만들었지만 거는 사람은 운영이라
 * 권한(maintenance)도 서버 재시작 · 키 교체(server)와 나눴다.
 */
export default function MaintenancePage() {
  return (
    <>
      <PageHeader
        title="서비스 점검"
        description="점검을 예고하고, 새 요청을 막는 소프트 종료를 거쳐 점검을 시작하고 끝냅니다. 걸면 유저 화면에 바로 보입니다."
      />

      <MaintenanceCard />
    </>
  );
}
