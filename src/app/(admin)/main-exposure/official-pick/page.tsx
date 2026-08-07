import PageHeader from "@/components/layout/PageHeader";
import CurationSlotBoard from "@/components/scenario/CurationSlotBoard";

export default function OfficialPickPage() {
  return (
    <>
      <PageHeader
        title="공식 캐릭터 맛보기"
        description="공식 세계관 중 메인 화면에 노출할 항목을 최대 3개까지 선택합니다."
      />

      <CurationSlotBoard
        slotKey="OFFICIAL_TASTE"
        guide="후보 목록에는 공식 캐릭터에 등록된 세계관만 노출됩니다. 저장해야 실제 앱에 반영됩니다."
      />
    </>
  );
}
