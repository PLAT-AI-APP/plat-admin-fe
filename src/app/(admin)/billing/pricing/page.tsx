import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import TabWorkspace from "@/components/layout/TabWorkspace";
import ChatBillingPolicyManager from "../chat-policy/_components/ChatBillingPolicyManager";
import CreditPolicyManager from "../credit-policies/_components/CreditPolicyManager";

/**
 * 노트 요금. 노트 가격을 정하는 화면을 한곳에 모았다.
 * 채팅 요금(기준값) · 모델별 요금(단가 · 판매 배수) · 고정 지급·차감이 모두 creditPolicy 권한이다.
 */
export default function NotePricingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
      <TabWorkspace
        title="노트 요금"
        tabs={[
          {
            label: "채팅 요금",
            value: "chat",
            description:
              "채팅은 쓴 토큰만큼 노트를 받습니다. 기준값을 바꾸면 다음 대화부터 적용되고, 이미 노트를 잡은 대화는 잡을 때의 값으로 매깁니다.",
            content: <ChatBillingPolicyManager />,
          },
          {
            label: "고정 지급·차감",
            value: "fixed",
            description:
              "금액이 고정된 노트 지급·차감 정책을 관리합니다. 채팅 사용 차감은 채팅 요금 · 모델별 요금에서 정합니다.",
            content: <CreditPolicyManager />,
          },
        ]}
      />
    </Suspense>
  );
}
