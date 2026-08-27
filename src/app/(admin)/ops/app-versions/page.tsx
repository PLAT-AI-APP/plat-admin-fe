import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import AppVersionManager from "./_components/AppVersionManager";

export default function AppVersionPage() {
  return (
    <>
      <PageHeader
        title="앱 버전 관리"
        description="앱 최소·권장 버전과 강제 업데이트 정책을 관리합니다."
      />

      {/*
        아직 앱이 이 정책을 읽어 가지 않는다. 화면을 지우지 않고 MOCK으로 남겨 두는
        이유는, 스토어 심사 주기에 맞춰 강제 업데이트를 걸어야 할 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 앱에 반영되지 않습니다">
        현재 앱은 이 화면의 최소 · 권장 버전을 읽어 가지 않습니다. 여기서 저장한
        값은 목업 데이터에만 남고 실제 강제 업데이트로 이어지지 않습니다. 앱이
        버전 정책을 조회하도록 붙이는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <AppVersionManager />
    </>
  );
}
