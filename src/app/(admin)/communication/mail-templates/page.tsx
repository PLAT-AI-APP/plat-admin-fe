import PageHeader from "@/components/layout/PageHeader";
import MailTemplateManager from "./_components/MailTemplateManager";

/**
 * 메일 템플릿. 서비스가 자동으로 보내는 메일이 무엇이고 어떻게 생겼는지 본다.
 * 템플릿 원본은 서버 코드에 있어 여기서는 고치지 않는다.
 */
export default function MailTemplatesPage() {
  return (
    <>
      <PageHeader
        title="메일 템플릿"
        description="서비스가 자동으로 보내는 메일과 발송 시점, 실제 모양을 확인합니다. 문구 · 모양은 개발 배포로 바뀝니다."
      />

      <MailTemplateManager />
    </>
  );
}
