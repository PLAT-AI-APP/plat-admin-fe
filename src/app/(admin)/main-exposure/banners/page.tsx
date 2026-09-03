import PageHeader from "@/components/layout/PageHeader";
import BannerManager from "./_components/BannerManager";

export default function BannerPage() {
  return (
    <>
      <PageHeader
        title="배너 관리"
        description="언어별로 메인 화면 최상단 캐러셀에 노출할 배너를 관리합니다."
      />

      <BannerManager />
    </>
  );
}
