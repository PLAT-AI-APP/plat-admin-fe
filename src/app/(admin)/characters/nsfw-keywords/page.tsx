import PageHeader from "@/components/layout/PageHeader";
import NsfwKeywordManager from "./_components/NsfwKeywordManager";

export default function NsfwKeywordPage() {
  return (
    <>
      <PageHeader
        title="NSFW 키워드"
        description="캐릭터·채팅 안전성 관리를 위한 키워드를 관리합니다."
      />

      <NsfwKeywordManager />
    </>
  );
}
