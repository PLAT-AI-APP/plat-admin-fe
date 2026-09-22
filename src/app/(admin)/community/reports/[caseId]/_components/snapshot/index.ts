import type { ComponentType } from "react";
import type { ReportSnapshotOf, ReportTargetType } from "@/type/report";
import CommentSnapshotView from "./CommentSnapshotView";
import UniverseSnapshotView from "./UniverseSnapshotView";

export interface SnapshotViewProps<T extends ReportTargetType> {
  snapshot: ReportSnapshotOf<T>;
}

/**
 * 대상 타입별 스냅샷 렌더러.
 *
 * 새 대상 타입(게시글 등)이 생기면 여기에 한 줄을 더한다. 타입마다 키가 강제되어 있어
 * 빠뜨리면 컴파일 때 알 수 있다.
 */
export const SNAPSHOT_VIEWS: {
  [K in ReportTargetType]: ComponentType<SnapshotViewProps<K>>;
} = {
  COMMENT: CommentSnapshotView,
  UNIVERSE: UniverseSnapshotView,
};
