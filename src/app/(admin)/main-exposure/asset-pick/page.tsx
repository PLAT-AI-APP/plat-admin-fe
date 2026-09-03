import PageHeader from "@/components/layout/PageHeader";
import HomeSectionBoard from "@/components/universe/HomeSectionBoard";

export default function AssetPickPage() {
  return (
    <>
      <PageHeader
        title="에셋 추천"
        description="언어별로 에셋이 많은 세계관 중 메인 화면에 노출할 항목을 최대 3개까지 선택합니다."
      />

      <HomeSectionBoard
        section="ASSET_PREVIEW"
        guide="에셋을 크게 보여 주는 섹션이라, 대표 이미지와 에셋이 잘 갖춰진 세계관을 고릅니다. 언어 탭마다 목록이 따로 있습니다."
      />
    </>
  );
}
