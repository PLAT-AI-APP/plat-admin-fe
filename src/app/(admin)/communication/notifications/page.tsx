import PageHeader from "@/components/layout/PageHeader";
import NotificationTemplateManager from "./_components/NotificationTemplateManager";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="알림 관리"
        description="앱 내 알림 · 푸시 · 이메일 템플릿의 문구와 활성 여부를 관리합니다."
      />

      <NotificationTemplateManager />
    </>
  );
}
