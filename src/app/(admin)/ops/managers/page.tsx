import PageHeader from "@/components/layout/PageHeader";
import AdminAccountManager from "./_components/AdminAccountManager";

export default function ManagerPage() {
  return (
    <>
      <PageHeader
        title="관리자 관리"
        description="관리자 계정과 권한을 관리합니다."
      />

      <AdminAccountManager />
    </>
  );
}
