import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import TabWorkspace from "@/components/layout/TabWorkspace";
import HomeSectionBoard from "@/components/universe/HomeSectionBoard";
import BannerManager from "./banners/_components/BannerManager";

/**
 * 홈 편성. 배너와 오늘의 PICK 을 탭으로 합쳤다 — 둘 다 앱 홈에 무엇을 걸지 정하는 일이다.
 *
 * 배너 순서는 저장 전 초안을 들고 있어, 저장하지 않고 탭을 옮기면 초안이 사라진다(화면 안 경고가 그대로 남는다).
 * 감춘 두 편성(공식 캐릭터 맛보기 · 에셋 추천)은 섹션이 돌아오면 여기 탭으로 붙인다.
 */
export default function HomeExposurePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
      <TabWorkspace
        title="홈 편성"
        tabs={[
          {
            label: "배너",
            value: "banners",
            description: "언어별로 메인 화면 최상단 캐러셀에 노출할 배너를 관리합니다.",
            content: <BannerManager />,
          },
          {
            label: "오늘의 PICK",
            value: "today-pick",
            description: "언어별로 메인 화면에 노출할 세계관을 최대 10개까지 선택합니다.",
            content: (
              <HomeSectionBoard
                section="TODAY_PICK"
                guide="언어 탭마다 목록이 따로 있습니다. 편성한 순서대로 그 언어의 메인 화면 '오늘의 PICK' 영역에 노출되며, 추가 · 해제 · 순서 변경은 누르는 즉시 반영됩니다."
              />
            ),
          },
        ]}
      />
    </Suspense>
  );
}
