import PageHeader from "@/components/layout/PageHeader";
import HomeSectionBoard from "@/components/universe/HomeSectionBoard";

export default function TodayPickPage() {
  return (
    <>
      <PageHeader
        title="오늘의 PICK"
        description="언어별로 메인 화면에 노출할 세계관을 최대 10개까지 선택합니다."
      />

      <HomeSectionBoard
        section="TODAY_PICK"
        guide="언어 탭마다 목록이 따로 있습니다. 편성한 순서대로 그 언어의 메인 화면 '오늘의 PICK' 영역에 노출되며, 추가 · 해제 · 순서 변경은 누르는 즉시 반영됩니다."
      />
    </>
  );
}
