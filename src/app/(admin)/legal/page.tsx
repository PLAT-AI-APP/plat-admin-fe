import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import LegalDocumentManager from "./_components/LegalDocumentManager";

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="법적 고지"
        description="이용약관·개인정보처리방침 버전 이력을 관리하고 활성 문서를 지정합니다."
      />

      {/*
        지금 약관·운영 규정은 Notion에서 관리한다. 화면을 지우지 않고 MOCK으로
        남겨 두는 이유는, 결국 버전 관리를 하며 업데이트하게 될 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 앱에 반영되지 않습니다">
        현재 이용약관 · 개인정보처리방침 · 운영 규정은 <b>Notion</b>에서
        관리합니다. 이 화면에서 저장한 내용은 앱에 반영되지 않습니다. 버전 관리가
        필요해지는 시점에 이 화면으로 전환합니다.
      </Alert>

      <LegalDocumentManager />
    </>
  );
}
