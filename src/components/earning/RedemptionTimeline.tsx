"use client";

import { formatDateTime } from "@/lib/dayjs";
import type { Redemption } from "@/type/earning";

interface RedemptionDetailLine {
  label: string;
  value: string;
}

/**
 * 행을 펼쳤을 때 보일 것. 행이 이미 보여 주는 신청 시각 · 크리에이터 · 받는 번호 · 상태는 반복하지 않는다.
 * 상태는 한 번만 바뀌므로(발송 대기 → 발송 / 반려, 노트는 신청과 함께 지급 완료) 이력 대신 처리 결과의 메모 · 사유만 남는다.
 *
 * @param withProcessor 행에 처리자 · 처리 시각이 없을 때(유저 상세) 함께 보인다.
 */
export const redemptionDetailLines = (row: Redemption, withProcessor: boolean): RedemptionDetailLine[] => {
  const lines: RedemptionDetailLine[] = [];
  if (withProcessor && row.processedAt) {
    lines.push({ label: "처리", value: `${row.processedByName ?? "시스템"} · ${formatDateTime(row.processedAt)}` });
  }
  if (row.status === "REJECTED" && row.rejectReason) {
    lines.push({ label: "반려 사유", value: row.rejectReason });
  }
  if (row.status === "ISSUED" && row.memo) {
    lines.push({ label: "발송 메모", value: row.memo });
  }
  return lines;
};

/** 펼친 행. 보일 것이 없는 행은 펼치지 않으므로 여기에 오면 한 줄 이상 있다. */
const RedemptionTimeline = ({ row, withProcessor = false }: { row: Redemption; withProcessor?: boolean }) => (
  <dl className="flex flex-col gap-1.5 bg-subtle px-5 py-3 body-5">
    {redemptionDetailLines(row, withProcessor).map((line) => (
      <div key={line.label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
        <dt className="text-font-2">{line.label}</dt>
        <dd className="whitespace-pre-wrap break-words text-font-1">{line.value}</dd>
      </div>
    ))}
  </dl>
);

export default RedemptionTimeline;
