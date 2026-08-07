import PageHeader from "@/components/layout/PageHeader";
import LogManager from "./_components/LogManager";

export default function LogPage() {
  return (
    <>
      <PageHeader title="로그" description="운영 로그를 조회합니다." />

      <LogManager />
    </>
  );
}
