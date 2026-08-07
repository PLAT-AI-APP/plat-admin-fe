import PageHeader from "@/components/layout/PageHeader";
import AppVersionManager from "./_components/AppVersionManager";

export default function AppVersionPage() {
  return (
    <>
      <PageHeader
        title="앱 버전 관리"
        description="앱 최소·권장 버전과 강제 업데이트 정책을 관리합니다."
      />

      <AppVersionManager />
    </>
  );
}
