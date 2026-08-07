import PageHeader from "@/components/layout/PageHeader";
import DummyCreatorManager from "./_components/DummyCreatorManager";

export default function DummyCreatorPage() {
  return (
    <>
      <PageHeader
        title="더미 크리에이터"
        description="초기 콘텐츠 운영을 위한 더미 크리에이터를 관리합니다."
      />

      <DummyCreatorManager />
    </>
  );
}
