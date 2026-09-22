import ReportCaseDetailView from "./_components/ReportCaseDetailView";

interface ReportCaseDetailPageProps {
  params: Promise<{ caseId: string }>;
}

export default async function ReportCaseDetailPage({
  params,
}: ReportCaseDetailPageProps) {
  const { caseId } = await params;

  /* Snowflake ID 라 숫자로 바꾸지 않는다. 바꾸면 끝자리가 뭉개진다. */
  return <ReportCaseDetailView caseId={caseId} />;
}
