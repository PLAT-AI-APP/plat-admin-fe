import type {
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/type/report";
import { daysAgo, pickOne, randomInt } from "../utils";
import { characters } from "./character";
import { comments, reportableCommentIds } from "./comment";
import { pickManager } from "./ops";
import { users } from "./user";

const REASONS: readonly ReportReason[] = [
  "SEXUAL",
  "VIOLENCE",
  "HATE",
  "COPYRIGHT",
  "SPAM",
  "ETC",
];

const STATUSES: readonly ReportStatus[] = [
  "PENDING",
  "PENDING",
  "REVIEWING",
  "RESOLVED",
  "REJECTED",
];

/** 캐릭터가 가장 많이 신고되고, 댓글이 그다음이다. */
const TARGET_TYPES: readonly ReportTargetType[] = [
  "CHARACTER",
  "CHARACTER",
  "CHARACTER",
  "COMMENT",
  "COMMENT",
  "USER",
];

const DETAIL_BY_REASON: Record<ReportReason, string[]> = {
  SEXUAL: [
    "대화 중 노골적인 성적 묘사가 반복됩니다.",
    "미성년으로 보이는 설정에 선정적인 표현이 섞여 있습니다.",
  ],
  VIOLENCE: [
    "잔인한 묘사가 여과 없이 등장합니다.",
    "자해를 부추기는 표현이 있습니다.",
  ],
  HATE: [
    "특정 집단을 비하하는 표현이 포함되어 있습니다.",
    "다른 이용자를 지목해 모욕했습니다.",
  ],
  COPYRIGHT: [
    "타 작품의 캐릭터를 그대로 사용했습니다.",
    "원작 대사를 무단으로 옮겨 적었습니다.",
  ],
  SPAM: [
    "외부 홍보 링크를 반복해서 올립니다.",
    "같은 내용을 도배하고 있습니다.",
  ],
  ETC: [
    "가이드라인에 어긋나는 것 같아 신고합니다.",
    "확인이 필요해 보입니다.",
  ],
};

const HANDLER_NOTES: Record<"RESOLVED" | "REJECTED", string[]> = {
  RESOLVED: [
    "가이드라인 위반이 확인되어 노출을 중지했습니다.",
    "작성자에게 경고를 전달하고 해당 내용을 숨김 처리했습니다.",
  ],
  REJECTED: [
    "신고 내용을 확인했으나 위반 사항이 없어 반려했습니다.",
    "정상적인 창작 범위로 판단해 반려했습니다.",
  ],
};

/**
 * 대상 타입에 맞는 실제 대상을 골라 이름과 본문 일부까지 맞춘다.
 * 누적 신고 수(targetReportCount)는 여기서 정하지 않는다.
 * 같은 대상에 달린 신고가 건마다 다른 누적 수를 들고 있으면 안 되므로,
 * 배열을 다 만든 뒤 실제 건수로 한 번에 채운다.
 */
const pickTarget = (seed: number, targetType: ReportTargetType) => {
  if (targetType === "COMMENT") {
    // 신고성 내용을 가진 댓글만 신고 대상이 된다.
    const commentId = pickOne(seed, reportableCommentIds);
    const comment = comments.find((item) => item.commentId === commentId)!;

    return {
      targetId: comment.commentId,
      targetName: comment.authorNickname,
      targetSnippet: comment.content,
    };
  }

  if (targetType === "USER") {
    const user = users[randomInt(seed, 0, users.length - 1)];

    return {
      targetId: user.userId,
      targetName: user.nickname,
      targetSnippet: user.email,
    };
  }

  const character = characters[randomInt(seed, 0, characters.length - 1)];

  return {
    targetId: character.characterId,
    targetName: character.name,
    targetSnippet: `크리에이터 ${character.creatorNickname}`,
  };
};

export const reports: Report[] = Array.from({ length: 38 }, (_, index) => {
  const seed = index + 1;
  const targetType = pickOne(seed, TARGET_TYPES);
  const target = pickTarget(seed * 3, targetType);
  const reporter = users[randomInt(seed * 5, 0, users.length - 1)];
  const reason = pickOne(seed * 7, REASONS);
  const status = pickOne(seed * 9, STATUSES);
  const isHandled = status === "RESOLVED" || status === "REJECTED";
  const createdDaysAgo = Math.floor(index / 2) + 1;
  const handler = pickManager(seed * 17);

  return {
    reportId: 38 - index,
    targetType,
    ...target,
    targetReportCount: 0,
    reporterId: reporter.userId,
    reporterNickname: reporter.nickname,
    reason,
    detail: pickOne(seed * 11, DETAIL_BY_REASON[reason]),
    status,
    handlerName: isHandled ? handler.name : undefined,
    handlerId: isHandled ? handler.managerId : undefined,
    handlerNote: isHandled
      ? pickOne(seed * 13, HANDLER_NOTES[status])
      : undefined,
    // 처리는 신고가 접수된 뒤에 이루어진다.
    handledAt: isHandled
      ? daysAgo(Math.max(0, createdDaysAgo - 1), 16)
      : undefined,
    createdAt: daysAgo(createdDaysAgo, 20 - (index % 11)),
  };
});

/**
 * 신고에서 파생되는 집계값을 채운다.
 * 신고가 접수·처리될 때마다 다시 불러 주면 누적 수가 계속 맞는다.
 */
export const syncReportDerivedCounts = () => {
  const countFor = (targetType: ReportTargetType, targetId: number) =>
    reports.filter(
      (report) =>
        report.targetType === targetType && report.targetId === targetId,
    ).length;

  // 같은 대상을 가리키는 신고는 모두 같은 누적 수를 들고 있어야 한다.
  reports.forEach((report) => {
    report.targetReportCount = countFor(report.targetType, report.targetId);
  });

  // 댓글의 "신고 N"과 신고 관리의 "누적 신고"는 같은 값이다.
  comments.forEach((comment) => {
    comment.reportCount = countFor("COMMENT", comment.commentId);
  });

  // 유저의 "누적 신고 접수"는 그 유저를 대상으로 접수된 신고의 수다.
  users.forEach((user) => {
    user.reportedCount = countFor("USER", user.userId);
  });
};

syncReportDerivedCounts();
