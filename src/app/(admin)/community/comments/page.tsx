import PageHeader from "@/components/layout/PageHeader";
import CommentManager from "./_components/CommentManager";

export default function CommentPage() {
  return (
    <>
      <PageHeader
        title="댓글 관리"
        description="세계관·캐릭터·공지사항에 달린 댓글을 한 화면에서 확인하고 숨김 처리합니다."
      />

      <CommentManager />
    </>
  );
}
