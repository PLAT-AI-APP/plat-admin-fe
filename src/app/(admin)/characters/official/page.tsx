import PageHeader from "@/components/layout/PageHeader";
import OfficialCharacterManager from "./_components/OfficialCharacterManager";

export default function OfficialCharacterPage() {
  return (
    <>
      <PageHeader
        title="공식 캐릭터"
        description="PLAT이 직접 운영하는 공식 캐릭터를 관리합니다."
      />

      <OfficialCharacterManager />
    </>
  );
}
