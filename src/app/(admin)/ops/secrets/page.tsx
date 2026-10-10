import PageHeader from "@/components/layout/PageHeader";
import SecretManager from "./_components/SecretManager";

export default function SecretPage() {
  return (
    <>
      <PageHeader
        title="시크릿"
        description="DB · 결제 · 로그인 · 메일 · Slack 키를 바꿉니다. 값은 보이지 않으며, 바꾼 값은 안내된 서버를 다시 띄워야 반영됩니다."
      />

      <SecretManager />
    </>
  );
}
