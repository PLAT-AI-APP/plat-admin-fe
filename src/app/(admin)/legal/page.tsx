import PageHeader from "@/components/layout/PageHeader";
import LegalDocumentManager from "./_components/LegalDocumentManager";

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="법적 고지"
        description="이용약관·개인정보처리방침 버전 이력을 관리하고 활성 문서를 지정합니다."
      />

      <LegalDocumentManager />
    </>
  );
}
