import PageHeader from "@/components/layout/PageHeader";
import OfficialAccountManager from "./_components/OfficialAccountManager";

export default function OfficialAccountPage() {
  return (
    <>
      <PageHeader
        title="공식 계정"
        description="공식으로 취급할 유저 ID를 등록합니다. 등록한 계정의 세계관이 공식으로 표시됩니다."
      />

      <OfficialAccountManager />
    </>
  );
}
