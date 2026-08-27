import type {
  Comment,
  CommentStatus,
  CommentTargetType,
} from "@/type/comment";
import { daysAgo, pickOne, randomInt } from "../utils";
import { characters, universes } from "./character";
import { pickManager } from "./ops";
import { users } from "./user";

const COMMENT_CONTENTS = [
  "이 세계관 진짜 몰입감 미쳤어요. 밤새 했습니다.",
  "설정이 촘촘해서 좋네요. 다음 편도 기대할게요.",
  "중간에 전개가 좀 급한 느낌이었어요.",
  "캐릭터 말투가 진짜 자연스러워요.",
  "이런 분위기 너무 좋아합니다. 감사합니다!",
  "결말 부분이 아쉬웠어요. 다른 루트도 있으면 좋겠습니다.",
  "삽화 퀄리티가 정말 훌륭하네요.",
  "처음엔 어려웠는데 하다 보니 빠져드네요.",
  "추천받고 왔는데 기대 이상입니다.",
  "업데이트 언제 되나요? 계속 기다리고 있어요.",
];

/** 신고가 쌓여 숨김 처리된 댓글에 쓰는 문구 */
const HIDDEN_REASONS = [
  "욕설 및 비방 표현이 포함되어 있습니다.",
  "스포일러를 사전 안내 없이 노출했습니다.",
  "광고성 링크가 포함되어 있습니다.",
  "타 이용자를 특정해 비난했습니다.",
];

const REPORTED_CONTENTS = [
  "이딴 걸 세계관이라고 만든 건가요?",
  "여기서 코인 정보 받아가세요 → bit.ly/xxxx",
  "○○님 또 여기 있네 ㅋㅋ 진짜 어딜 가나 보이네",
  "결말 스포합니다. 주인공 죽음.",
];

const TARGET_TYPES: readonly CommentTargetType[] = [
  "UNIVERSE",
  "UNIVERSE",
  "UNIVERSE",
  "CHARACTER",
];

/** 대상 타입에 맞는 실제 대상을 골라 이름까지 맞춘다. */
const pickTarget = (seed: number, targetType: CommentTargetType) => {
  if (targetType === "CHARACTER") {
    const character = characters[randomInt(seed, 0, characters.length - 1)];

    return { targetId: character.characterId, targetName: character.name };
  }

  const universe = universes[randomInt(seed, 0, universes.length - 1)];

  return { targetId: universe.universeId, targetName: universe.name };
};

/**
 * 신고가 들어올 만한 댓글의 ID.
 * 신고 시드(db/report)가 이 중에서 대상을 고르고, 실제 신고 건수를
 * 각 댓글의 reportCount로 되돌려 준다. 그래야 댓글의 "신고 N"과
 * 신고 관리의 "누적 신고"가 같은 수를 가리킨다.
 */
export const reportableCommentIds: number[] = [];

export const comments: Comment[] = Array.from({ length: 64 }, (_, index) => {
  const seed = index + 1;
  const targetType = pickOne(seed, TARGET_TYPES);
  const target = pickTarget(seed * 3, targetType);
  const author = users[randomInt(seed * 5, 0, users.length - 1)];

  // 7건 중 1건은 신고가 쌓인 댓글로 만들어 처리 흐름을 확인할 수 있게 한다.
  const isReported = index % 7 === 3;
  const status: CommentStatus = isReported
    ? index % 14 === 3
      ? "HIDDEN"
      : "VISIBLE"
    : index % 19 === 5
      ? "DELETED"
      : "VISIBLE";

  const isHandled = status === "HIDDEN";
  const commentId = 64 - index;
  const createdDaysAgo = Math.floor(index / 2);
  const handler = pickManager(seed * 17);

  if (isReported) reportableCommentIds.push(commentId);

  return {
    commentId,
    targetType,
    targetId: target.targetId,
    targetName: target.targetName,
    // 4건 중 1건은 대댓글로 만든다.
    parentCommentId: index % 4 === 2 ? commentId + 1 : undefined,
    content: isReported
      ? pickOne(seed * 7, REPORTED_CONTENTS)
      : pickOne(seed * 7, COMMENT_CONTENTS),
    authorId: author.userId,
    authorNickname: author.nickname,
    status,
    // 실제 신고 건수는 db/report가 채운다.
    reportCount: 0,
    likeCount: randomInt(seed * 11, 0, 320),
    hiddenReason: isHandled ? pickOne(seed * 13, HIDDEN_REASONS) : undefined,
    handledBy: isHandled ? handler.name : undefined,
    handledById: isHandled ? handler.managerId : undefined,
    // 숨김 처리는 댓글이 작성된 뒤에 일어난다.
    handledAt: isHandled
      ? daysAgo(Math.max(0, createdDaysAgo - 1), 16)
      : undefined,
    createdAt: daysAgo(createdDaysAgo, 22 - (index % 12)),
  };
});
