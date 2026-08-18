import PageHeader from "@/components/layout/PageHeader";
import MyAccountView from "./_components/MyAccountView";

export default function MyAccountPage() {
  return (
    <>
      <PageHeader
        title="내 계정"
        description="로그인한 계정 정보와 내 직책이 가진 권한을 확인합니다."
      />

      <MyAccountView />
    </>
  );
}
