import PageHeader from "@/components/layout/PageHeader";
import CurationSlotBoard from "@/components/universe/CurationSlotBoard";

export default function AssetPickPage() {
  return (
    <>
      <PageHeader
        title="에셋 추천"
        description="에셋이 많은 세계관 중 메인 화면에 노출할 항목을 최대 3개까지 선택합니다."
      />

      <CurationSlotBoard
        slotKey="ASSET_RICH"
        guide="후보 목록은 에셋 보유 수 내림차순으로 정렬됩니다. 저장해야 실제 앱에 반영됩니다."
      />
    </>
  );
}
