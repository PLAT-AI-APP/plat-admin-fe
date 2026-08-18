import PageHeader from "@/components/layout/PageHeader";
import CurationSlotBoard from "@/components/universe/CurationSlotBoard";

export default function TodayPickPage() {
  return (
    <>
      <PageHeader
        title="오늘의 PICK"
        description="메인 화면에 노출할 세계관을 최대 10개까지 선택합니다."
      />

      <CurationSlotBoard
        slotKey="TODAY_PICK"
        guide="선택한 순서대로 메인 화면 '오늘의 PICK' 영역에 노출됩니다. 저장해야 실제 앱에 반영됩니다."
      />
    </>
  );
}
