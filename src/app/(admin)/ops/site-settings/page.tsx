import PageHeader from "@/components/layout/PageHeader";
import SignupPauseCard from "./_components/SignupPauseCard";
import SiteSettingsForm from "./_components/SiteSettingsForm";

/**
 * 사이트 설정. 사용자 사이트 푸터의 사업자 정보와 고객센터를 고친다.
 * 서비스 점검처럼 저장하면 유저 화면에 바로(최대 1분) 보인다.
 */
export default function SiteSettingsPage() {
  return (
    <>
      <PageHeader
        title="사이트 설정"
        description="사용자 사이트 푸터의 사업자 정보 · 고객센터 · 개인정보보호책임자를 관리합니다. 저장하면 1분 안에 유저 화면에 반영됩니다."
      />

      <div className="flex flex-col gap-4">
        <SignupPauseCard />
        <SiteSettingsForm />
      </div>
    </>
  );
}
