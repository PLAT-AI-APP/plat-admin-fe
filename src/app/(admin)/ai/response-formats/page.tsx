import PageHeader from "@/components/layout/PageHeader";
import ResponseFormatManager from "./_components/ResponseFormatManager";

export default function ResponseFormatPage() {
  return (
    <>
      <PageHeader
        title="응답 형식"
        description="채팅형·소설형처럼 한 턴의 출력 상한·최근 대화 수·분량·문체를 정합니다. 요금은 쓴 토큰만큼이라 형식이 곧 그 턴의 가격대입니다. 제작자는 시나리오마다 허용할 형식을 고릅니다."
      />
      <ResponseFormatManager />
    </>
  );
}
