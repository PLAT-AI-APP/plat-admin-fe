import PageHeader from "@/components/layout/PageHeader";
import AdminAccountManager from "./_components/AdminAccountManager";

export default function ManagerPage() {
  return (
    <>
      <PageHeader
        title="운영자 계정"
        description="운영자 계정과 권한을 관리합니다."
      />

      <AdminAccountManager />
    </>
  );
}
