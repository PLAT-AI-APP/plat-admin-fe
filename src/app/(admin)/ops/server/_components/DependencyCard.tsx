import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Table, { type TableColumn } from "@/components/ui/Table";
import { formatWithCommas } from "@/lib/utils";
import type { DependencyHealth } from "@/type/ops";
import {
  HEALTH_STATUS_LABEL,
  HEALTH_STATUS_TONE,
} from "../_constants/serverStatus";

interface DependencyCardProps {
  dependencies: DependencyHealth[];
  isLoading: boolean;
}

/** 응답 시간 임계. 같은 머신의 Redis가 50ms면 이미 무언가 잘못된 것이다. */
const SLOW_LATENCY_MS = 50;

/**
 * 외부 의존성.
 *
 * 상태만으로는 부족하다. "UP인데 느린" 구간이 장애 직전의 모습이라
 * 응답 시간을 함께 두고, 느린 줄은 색으로 먼저 보이게 한다.
 */
const DependencyCard = ({ dependencies, isLoading }: DependencyCardProps) => {
  const columns: TableColumn<DependencyHealth>[] = [
    {
      key: "name",
      header: "이름",
      width: "240px",
      render: (row) => <span className="text-font-1">{row.name}</span>,
    },
    {
      key: "status",
      header: "상태",
      width: "120px",
      render: (row) => (
        <Badge tone={HEALTH_STATUS_TONE[row.status]}>
          {HEALTH_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: "latencyMs",
      header: "응답 시간",
      width: "140px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span
          className={
            row.latencyMs >= SLOW_LATENCY_MS ? "text-warning" : "text-font-1"
          }
        >
          {formatWithCommas(row.latencyMs)} ms
        </span>
      ),
    },
    {
      key: "message",
      header: "메시지",
      render: (row) => <span className="text-font-2">{row.message ?? "-"}</span>,
    },
  ];

  return (
    <Card
      id="server-dependency"
      title="외부 의존성"
      description={`연결된 저장소 · 외부 API · ${SLOW_LATENCY_MS}ms 이상은 느린 것으로 표시합니다`}
      noPadding
    >
      <Table
        columns={columns}
        rows={dependencies}
        getRowKey={(row) => row.name}
        isLoading={isLoading}
        skeletonRows={5}
        emptyTitle="연결된 외부 의존성이 없습니다."
        emptyDescription="서버에 의존성이 등록되면 이 목록에 표시됩니다."
      />
    </Card>
  );
};

export default DependencyCard;
