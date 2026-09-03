import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";
import PaymentRecordManager from "./_components/PaymentRecordManager";

export default function PaymentRetentionPage() {
  return (
    <>
      <PageHeader
        title="결제 보존 원장"
        description="탈퇴 · 파기 이후에도 법정 기간 동안 남기는 결제 기록입니다. 결제사 거래번호로 조회합니다."
      />

      {/*
        보존 원장을 아직 실서버가 내려주지 않는다. 화면을 지우지 않고 MOCK으로 남겨
        두는 이유는, 파기된 결제를 되짚을 수 있는 자리가 여기밖에 없기 때문이다.

        이 화면은 특히 배지가 필요하다 — **여기 보이는 숫자를 그대로 문의 답변이나
        환불 처리에 쓰게 되는 화면**이라, 목업이라는 것을 모르면 없는 거래를 있다고
        답하게 된다.
      */}
      <Alert tone="warning" title="MOCK 화면 · 아직 실서버에 연결되지 않았습니다">
        여기 결제 기록은 <b>목업 데이터</b>입니다. 실제 결제 · 환불 내역이 아니므로
        문의 답변이나 환불 처리의 근거로 쓰지 마세요. 보존 원장 API가 붙는 시점에
        실제 연동으로 전환합니다.
      </Alert>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <PaymentRecordManager />
      </Suspense>
    </>
  );
}
