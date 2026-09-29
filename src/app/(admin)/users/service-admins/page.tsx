import PageHeader from "@/components/layout/PageHeader";
import ServiceAdminManager from "./_components/ServiceAdminManager";

export default function ServiceAdminPage() {
  return (
    <>
      <PageHeader
        title="서비스 관리자"
        description="운영자가 서비스 화면에서 쓰는 계정에 관리자(ADMIN) 역할을 주거나 뺍니다. 관리자 콘솔 계정과는 별개입니다."
      />

      <ServiceAdminManager />
    </>
  );
}
