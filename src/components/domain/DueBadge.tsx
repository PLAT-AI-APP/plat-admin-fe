import { daysLeftKst, nowKst, toKst } from "@/lib/dayjs";
import Badge from "@/components/ui/Badge";

interface DueBadgeProps {
  /** 처리 기한. 기한이 없는 건(이미 처리됨)은 비어 있다. */
  dueAt: string | null | undefined;
}

/**
 * 처리 기한 표시. 문의 · 신고 · 환불이 함께 쓴다.
 *
 * 기한은 서버가 접수 + 3영업일로 정해 내려 준다. 지났으면 "기한 초과", 아니면 남은 날(KST 날짜 기준)을 센다.
 * 기한이 없으면 처리할 것이 없다는 뜻이라 `-` 로 둔다.
 */
const DueBadge = ({ dueAt }: DueBadgeProps) => {
  if (!dueAt) return <span className="text-font-disabled">-</span>;

  if (!nowKst().isBefore(toKst(dueAt))) {
    return <Badge tone="warning">기한 초과</Badge>;
  }

  const daysLeft = daysLeftKst(dueAt);

  return (
    <Badge tone="neutral" className="tabular-nums">
      {daysLeft <= 0 ? "D-day" : `D-${daysLeft}`}
    </Badge>
  );
};

export default DueBadge;
