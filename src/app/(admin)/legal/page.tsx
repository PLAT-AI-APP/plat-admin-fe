import PageHeader from "@/components/layout/PageHeader";
import LegalDocumentManager from "./_components/LegalDocumentManager";

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="법적 고지"
        description="이용약관·개인정보처리방침·청소년 보호 정책의 버전과 언어별 번역본을 관리합니다. 이용약관·개인정보처리방침은 게시한 버전의 시행일부터 유저 재동의 대상이 됩니다."
      />

      <LegalDocumentManager />
    </>
  );
}
