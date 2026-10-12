import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import TabWorkspace from "@/components/layout/TabWorkspace";
import AiModelManager from "./_components/AiModelManager";
import ModelCatalogManager from "../catalog/_components/ModelCatalogManager";

/** 모델. 운영 설정과 카탈로그(테스트 호출)를 탭으로 합쳤다 — 같은 모델 표를 두 질문으로 본다. */
export default function AiModelPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
      <TabWorkspace
        title="모델"
        tabs={[
          {
            label: "설정",
            value: "settings",
            description:
              "모델 사용 여부와 역할, 최대 출력 토큰 · temperature 를 관리합니다. 요금은 결제·노트 > 노트 요금에서 고칩니다.",
            content: <AiModelManager />,
          },
          {
            label: "카탈로그",
            value: "catalog",
            description: "사용 가능한 AI 모델을 확인하고 테스트 호출합니다.",
            content: <ModelCatalogManager />,
          },
        ]}
      />
    </Suspense>
  );
}
