import Link from "next/link";
import { formatDateTime } from "@/lib/dayjs";
import type { SnapshotViewProps } from "./index";

/**
 * AI 답변 스냅샷. 답변만으로는 무엇에 대한 대답인지 알 수 없어 바로 앞의 신고자 메시지를 함께 보여 준다.
 * 신고자가 유도한 답변인지(예: "무섭게 말해 줘")가 판정의 절반이다.
 */
const MessageSnapshotView = ({ snapshot }: SnapshotViewProps<"MESSAGE">) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 body-5 text-font-2">
      <Link
        href={`/universes/${snapshot.universeId}`}
        className="font-medium text-font-1 transition hover:text-brand"
      >
        {snapshot.universeTitle || `#${snapshot.universeId}`}
      </Link>
      <span>·</span>
      <span>
        제작자{" "}
        <Link
          href={`/users/${snapshot.creatorUserId}`}
          className="font-medium text-font-1 transition hover:text-brand"
        >
          {snapshot.creatorNickname || `#${snapshot.creatorUserId}`}
        </Link>
      </span>
      <span>·</span>
      <span className="tabular-nums">{formatDateTime(snapshot.writtenAt)} 생성</span>
    </div>

    <div className="flex flex-col gap-1">
      <p className="caption-2 text-font-2">신고자 메시지</p>
      <p className="rounded-field border border-border-main px-4 py-3 body-5 whitespace-pre-line break-all text-font-2">
        {snapshot.precedingUserContent ?? "(앞선 메시지 없음 — 대화 첫 답변)"}
      </p>
    </div>

    <div className="flex flex-col gap-1">
      <p className="caption-2 text-font-2">신고된 AI 답변</p>
      <p className="rounded-field bg-subtle px-4 py-3 body-4 whitespace-pre-line break-all text-font-1">
        {snapshot.content || "(본문 없음)"}
      </p>
    </div>
  </div>
);

export default MessageSnapshotView;
