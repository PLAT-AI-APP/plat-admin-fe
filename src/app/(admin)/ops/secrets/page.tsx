import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import TabWorkspace from "@/components/layout/TabWorkspace";
import SecretManager from "./_components/SecretManager";
import AiKeyManager from "../../ai/keys/_components/AiKeyManager";

/**
 * 키·시크릿. 서버 시크릿과 AI 제공사 키를 탭으로 합쳤다 — 둘 다 server 권한으로 바꾸는 비밀 값이다.
 * 반영 방식이 달라(재시작 필요 · 몇 초 안에 반영) 탭마다 설명을 따로 둔다.
 */
export default function KeyAndSecretPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
      <TabWorkspace
        title="키·시크릿"
        tabs={[
          {
            label: "서버 시크릿",
            value: "secrets",
            description:
              "DB · 결제 · 로그인 · 메일 · Slack 키를 바꿉니다. 값은 보이지 않으며, 바꾼 값은 안내된 서버를 다시 띄워야 반영됩니다.",
            content: <SecretManager />,
          },
          {
            label: "AI 제공사 키",
            value: "ai-keys",
            description:
              "제공사별 메인 · 서브 키를 저장하고 교체합니다. 저장하면 재시작 없이 몇 초 안에 반영됩니다.",
            content: <AiKeyManager />,
          },
        ]}
      />
    </Suspense>
  );
}
