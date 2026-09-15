import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import PushCampaignManager from "./_components/PushCampaignManager";

export default function PushPage() {
  return (
    <>
      <PageHeader
        title="푸시 발송"
        description="푸시 메시지를 작성하고 발송합니다."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <PushCampaignManager />
      </Suspense>
    </>
  );
}
