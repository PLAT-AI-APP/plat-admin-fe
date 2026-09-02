import PageHeader from "@/components/layout/PageHeader";
import HomeSectionBoard from "@/components/universe/HomeSectionBoard";

export default function OfficialPickPage() {
  return (
    <>
      <PageHeader
        title="공식 캐릭터 맛보기"
        description="언어별로 공식 세계관 중 메인 화면에 노출할 항목을 최대 3개까지 선택합니다."
      />

      <HomeSectionBoard
        section="OFFICIAL_PREVIEW"
        guide="후보 목록에는 '공식 계정'으로 지정된 크리에이터의 세계관 중 승인 · 공개 상태인 것만 노출됩니다. 후보가 비어 있으면 세계관 > 공식 계정에서 계정을 먼저 등록하세요."
      />
    </>
  );
}
