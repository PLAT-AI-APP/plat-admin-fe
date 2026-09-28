import PageHeader from "@/components/layout/PageHeader";
import LegalDocumentManager from "./_components/LegalDocumentManager";

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="법적 고지"
        description="이용약관·개인정보처리방침 버전을 등록하고 게시합니다. 게시한 버전은 시행일부터 유저 재동의 대상이 됩니다."
      />

      <LegalDocumentManager />
    </>
  );
}
