"use client";

import { useRedemptionHistoriesQuery } from "@/api/earning/getRedemptionList";
import { formatDateTime } from "@/lib/dayjs";
import type { Redemption } from "@/type/earning";
import { maskPhone } from "./earningFormat";

const STEP_TITLE: Record<string, string> = {
  REQUESTED: "신청",
  GRANTING: "포인트 차감",
  ISSUED: "발송",
  REJECTED: "반려",
};

/** 교환 신청 한 건에 대해 누가 언제 무엇을 했는지. 행을 펼칠 때만 이력을 부른다. */
const RedemptionTimeline = ({ row }: { row: Redemption }) => {
  const { data: histories = [], isLoading } = useRedemptionHistoriesQuery(row.redemptionId);

  const steps = [
    {
      key: "requested",
      at: row.requestedAt,
      title: "신청",
      actor: row.nickname ?? row.userId,
      memo: row.recipientPhone ? `받는 번호 ${maskPhone(row.recipientPhone)}` : "",
    },
    ...histories
      .filter((item) => item.toStatus !== "REQUESTED")
      .map((item) => ({
        key: item.historyId,
        at: item.createdAt,
        title: STEP_TITLE[item.toStatus] ?? item.toStatus,
        actor: item.actorName ?? (item.actorType === "SYSTEM" ? "시스템" : "-"),
        memo: item.memo ?? "",
      })),
  ];

  return (
    <ol className="flex flex-col gap-2 bg-subtle px-5 py-3 body-5">
      {steps.map((step) => (
        <li key={step.key} className="grid grid-cols-[150px_80px_120px_1fr] gap-3">
          <span className="text-font-2">{formatDateTime(step.at)}</span>
          <span className="font-semibold">{step.title}</span>
          <span className="text-font-2">{step.actor}</span>
          <span className="text-font-2">{step.memo}</span>
        </li>
      ))}
      {isLoading && <li className="text-font-2">처리 내역을 불러오는 중</li>}
      {row.status === "REQUESTED" && <li className="text-font-2">발송 대기 중</li>}
      {row.status === "GRANTING" && <li className="text-font-2">노트 지급 재시도 대기 중 (5분 간격)</li>}
    </ol>
  );
};

export default RedemptionTimeline;
