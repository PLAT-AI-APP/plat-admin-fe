import PaymentOrderDetailView from "./_components/PaymentOrderDetailView";

interface PaymentOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentOrderDetailPage({
  params,
}: PaymentOrderDetailPageProps) {
  const { orderId } = await params;

  /* Snowflake ID 라 숫자로 바꾸지 않는다. 바꾸면 끝자리가 뭉갠다. */
  return <PaymentOrderDetailView orderId={orderId} />;
}
