import type {
  Report,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/type/report";
import { daysAgo, pickOne, randomInt } from "../utils";
import { characters } from "./character";
import { comments } from "./comment";
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

/** 대상 타입에 맞는 실제 대상을 골라 이름과 본문 일부까지 맞춘다. */
const pickTarget = (seed: number, targetType: ReportTargetType) => {
  if (targetType === "COMMENT") {
    const comment = comments[randomInt(seed, 0, comments.length - 1)];

    return {
      targetId: comment.commentId,
      targetName: comment.authorNickname,
      targetSnippet: comment.content,
      targetReportCount: Math.max(comment.reportCount, 1),
    };
  }

  if (targetType === "USER") {
    const user = users[randomInt(seed, 0, users.length - 1)];

    return {
      targetId: user.userId,
      targetName: user.nickname,
      targetSnippet: user.email,
      targetReportCount: Math.max(user.reportedCount, 1),
    };
  }

  const character = characters[randomInt(seed, 0, characters.length - 1)];

  return {
    targetId: character.characterId,
    targetName: character.name,
    targetSnippet: `크리에이터 ${character.creatorNickname}`,
    targetReportCount: randomInt(seed * 3, 1, 12),
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

  return {
    reportId: 38 - index,
    targetType,
    ...target,
    reporterId: reporter.userId,
    reporterNickname: reporter.nickname,
    reason,
    detail: pickOne(seed * 11, DETAIL_BY_REASON[reason]),
    status,
    handlerName: isHandled ? "운영자" : undefined,
    handlerNote: isHandled
      ? pickOne(seed * 13, HANDLER_NOTES[status])
      : undefined,
    handledAt: isHandled ? daysAgo(index, 16) : undefined,
    createdAt: daysAgo(Math.floor(index / 2) + 1, 20 - (index % 11)),
  };
});
