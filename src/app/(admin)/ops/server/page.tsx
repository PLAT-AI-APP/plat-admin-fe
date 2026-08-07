import PageHeader from "@/components/layout/PageHeader";
import ServerStatusBoard from "./_components/ServerStatusBoard";

export default function ServerStatusPage() {
  return (
    <>
      <PageHeader
        title="서버 상태"
        description="서버와 외부 의존성 상태를 확인합니다."
      />

      <ServerStatusBoard />
    </>
  );
}
