import PageHeader from "@/components/layout/PageHeader";
import QnaManager from "./_components/QnaManager";

export default function QnaPage() {
  return (
    <>
      <PageHeader
        title="Q&A 관리"
        description="접수된 문의를 확인하고 답변합니다."
      />

      <QnaManager />
    </>
  );
}
