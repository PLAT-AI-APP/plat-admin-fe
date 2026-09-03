import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import ModelCatalogManager from "./_components/ModelCatalogManager";

export default function ModelCatalogPage() {
  return (
    <>
      <PageHeader
        title="모델 카탈로그"
        description="사용 가능한 AI 모델을 확인하고 테스트 호출합니다."
      />

      {/*
        모델 목록과 테스트 호출을 아직 실서버가 받아 주지 않는다. 화면을 지우지 않고
        MOCK으로 남겨 두는 이유는, 모델을 새로 붙일 때 먼저 열어 볼 자리이기 때문이다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기 모델 목록과 테스트 호출 결과는 <b>목업 데이터</b>입니다. 실제 모델을
        호출하지 않습니다. 카탈로그 API가 붙는 시점에 실제 연동으로 전환합니다.
      </Alert>

      <ModelCatalogManager />
    </>
  );
}
