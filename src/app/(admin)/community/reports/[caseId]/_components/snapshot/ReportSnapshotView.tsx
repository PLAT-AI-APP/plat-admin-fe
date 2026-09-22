import type { ComponentType } from "react";
import type { ReportSnapshot } from "@/type/report";
import { SNAPSHOT_VIEWS } from "./index";

interface ReportSnapshotViewProps {
  snapshot: ReportSnapshot | null;
}

/** 스냅샷의 `type`으로 렌더러를 골라 그린다. */
const ReportSnapshotView = ({ snapshot }: ReportSnapshotViewProps) => {
  if (!snapshot) {
    return <p className="body-5 text-font-disabled">남아 있는 스냅샷이 없습니다.</p>;
  }

  /* 레지스트리는 타입별로 좁혀져 있어, 판별 유니온을 넘기려면 한 번 넓혀야 한다. */
  const View = SNAPSHOT_VIEWS[snapshot.type] as ComponentType<{
    snapshot: ReportSnapshot;
  }>;

  return <View snapshot={snapshot} />;
};

export default ReportSnapshotView;
