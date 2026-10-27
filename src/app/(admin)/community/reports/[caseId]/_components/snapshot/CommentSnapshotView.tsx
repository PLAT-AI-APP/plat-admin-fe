import Link from "next/link";
import { formatDateTime } from "@/lib/dayjs";
import Badge from "@/components/ui/Badge";
import type { SnapshotViewProps } from "./index";

/** 댓글 스냅샷. 신고자가 본 본문을 그대로 보여 주고, 작성자 · 소속 세계관으로 건너갈 수 있게 한다. */
const CommentSnapshotView = ({ snapshot }: SnapshotViewProps<"COMMENT">) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 body-5 text-font-2">
      <Link
        href={`/users/${snapshot.authorUserId}`}
        className="font-medium text-font-1 transition hover:text-brand"
      >
        {snapshot.authorNickname || `#${snapshot.authorUserId}`}
      </Link>
      <span>·</span>
      <span className="tabular-nums">{formatDateTime(snapshot.writtenAt)} 작성</span>
      {snapshot.parentCommentId && <Badge tone="neutral">답글</Badge>}
    </div>

    <p className="rounded-field bg-subtle px-4 py-3 body-4 whitespace-pre-line break-all text-font-1">
      {snapshot.content || "(본문 없음)"}
    </p>

    <p className="body-5 text-font-2">
      소속 세계관{" "}
      <Link
        href={`/universes/${snapshot.universeId}`}
        className="font-medium text-font-1 transition hover:text-brand"
      >
        {snapshot.universeTitle || `#${snapshot.universeId}`}
      </Link>
    </p>
  </div>
);

export default CommentSnapshotView;
