import PageHeader from "@/components/layout/PageHeader";
import BannedWordManager from "./_components/BannedWordManager";

export default function BannedWordPage() {
  return (
    <>
      <PageHeader
        title="금지어 관리"
        description="캐릭터·세계관·대화에 쓰이는 표현을 걸러 냅니다. 등록·삭제는 즉시 검사에 반영됩니다."
      />

      <BannedWordManager />
    </>
  );
}
