import type { ReactNode } from "react";

interface ReportInfoRowProps {
  label: string;
  value: ReactNode;
}

/** 상세 카드의 정보 한 줄. 결제 상세와 같은 모양으로 둔다. */
const ReportInfoRow = ({ label, value }: ReportInfoRowProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-border-main py-2.5 last:border-b-0">
    <span className="shrink-0 body-5 text-font-2">{label}</span>
    <span className="min-w-0 text-right body-5 break-all text-font-1">{value}</span>
  </div>
);

export default ReportInfoRow;
