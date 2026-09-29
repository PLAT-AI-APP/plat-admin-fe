import PageHeader from "@/components/layout/PageHeader";
import AiKeyManager from "./_components/AiKeyManager";

export default function AiKeyPage() {
  return (
    <>
      <PageHeader
        title="API 키"
        description="제공사별 메인 · 서브 키를 저장하고 교체합니다. 저장하면 재시작 없이 몇 초 안에 반영됩니다."
      />

      <AiKeyManager />
    </>
  );
}
