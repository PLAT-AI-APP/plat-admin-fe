import PageHeader from "@/components/layout/PageHeader";
import ChatBillingPolicyManager from "./_components/ChatBillingPolicyManager";

export default function ChatBillingPolicyPage() {
  return (
    <>
      <PageHeader
        title="채팅 요금 정책"
        description="채팅은 쓴 토큰만큼 노트를 받습니다. 기준값을 바꾸면 다음 대화부터 적용되고, 이미 노트를 잡은 대화는 잡을 때의 값으로 매깁니다."
      />
      <ChatBillingPolicyManager />
    </>
  );
}
