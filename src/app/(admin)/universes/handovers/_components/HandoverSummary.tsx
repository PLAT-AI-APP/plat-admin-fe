"use client";

import Link from "next/link";
import { Calendar, ExternalLink, Flag, MessageSquare } from "@/icons";
import dayjs, { daysLeftKst, formatDateTime } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import { HANDOVER_AGE_BASIS_LABEL, type UniverseHandover } from "@/type/universeHandover";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import EntityImage from "@/components/ui/EntityImage";
import { HANDOVER_DEADLINE_WARN_DAYS } from "../_constants/handoverOptions";

/** 남은 기한 표기와 색. 목록의 기한 칸과 같은 기준이다. */
export const describeDeadline = (deadlineAt: string): { label: string; tone: BadgeTone } => {
  if (dayjs(deadlineAt).isBefore(dayjs())) return { label: "기한 지남", tone: "danger" };

  const daysLeft = daysLeftKst(deadlineAt);
  return {
    label: daysLeft === 0 ? "D-day" : `D-${daysLeft}`,
    tone: daysLeft <= HANDOVER_DEADLINE_WARN_DAYS ? "warning" : "neutral",
  };
};

/**
 * 승인 · 반려 창 머리의 심사 대상 요약.
 *
 * 판단에 쓰는 것(대표 이미지 · 다른 유저 방 · 신고 · 기한 · 성년 근거)을 한눈에 둔다.
 * 설정 전문과 다른 이미지는 세계관 상세를 새 창으로 연다.
 */
const HandoverSummary = ({ handover }: { handover: UniverseHandover }) => {
  const title = handover.universeTitle ?? "(제목 없음)";
  const deadline = describeDeadline(handover.deadlineAt);

  return (
    <div className="flex gap-3 rounded-card border border-border-main bg-subtle p-3">
      <EntityImage
        src={resolveImageUrl(null, handover.profileImageFileId, "UNIVERSE_PROFILE", "SQ140")}
        alt={title}
        fileId={handover.profileImageFileId}
        className="w-18 shrink-0"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="title-5 min-w-0 truncate text-font-1">{title}</p>
            <Link
              href={`/universes/${handover.universeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="body-6 inline-flex shrink-0 items-center gap-0.5 text-info hover:underline"
            >
              설정 · 이미지
              <ExternalLink size={12} />
            </Link>
          </div>
          <p className="body-6 truncate text-font-2 tabular-nums">
            인수 #{handover.handoverId} · 동의 {formatDateTime(handover.consentedAt)} · v
            {handover.consentVersion}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="neutral" leftIcon={<MessageSquare size={12} />}>
            다른 유저 방 {formatWithCommas(handover.otherRoomCount)}
          </Badge>
          <Badge
            tone={handover.pendingReportCount > 0 ? "danger" : "neutral"}
            leftIcon={<Flag size={12} />}
          >
            신고 {formatWithCommas(handover.reportCount)}
            {handover.pendingReportCount > 0 &&
              ` · 미처리 ${formatWithCommas(handover.pendingReportCount)}`}
          </Badge>
          {handover.status === "PENDING" && (
            <Badge tone={deadline.tone} leftIcon={<Calendar size={12} />}>
              {deadline.label}
            </Badge>
          )}
          <Badge tone={handover.ageBasis === "SELF_ATTESTED" ? "warning" : "neutral"}>
            {HANDOVER_AGE_BASIS_LABEL[handover.ageBasis]}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default HandoverSummary;
