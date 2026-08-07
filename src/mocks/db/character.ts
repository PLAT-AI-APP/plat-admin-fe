import type {
  Character,
  ChatExportJob,
  NsfwKeyword,
  Scenario,
} from "@/type/character";
import { daysAgo, pickOne, randomInt } from "../utils";

const CHARACTER_NAMES = [
  "루시아",
  "카이런",
  "세라핀",
  "이든",
  "노아",
  "미라벨",
  "하윤",
  "제피르",
  "아리아",
  "레온",
  "유이",
  "테오",
  "클로에",
  "시온",
  "라비",
  "디안",
  "소요",
  "베리트",
  "하늘",
  "이슬",
  "칼릭스",
  "엘리",
  "무연",
  "리안",
];

const CREATOR_NICKNAMES = [
  "달빛작가",
  "코코넛",
  "PLAT공식",
  "이야기공방",
  "밤하늘",
  "무명작가",
  "픽셀드림",
  "은하수",
];

const TAG_POOL = [
  "판타지",
  "로맨스",
  "학원물",
  "SF",
  "미스터리",
  "일상",
  "무협",
  "힐링",
  "추리",
  "역사",
  "느와르",
  "코미디",
];

const SCENARIO_PREFIX = [
  "잊혀진",
  "달빛 아래",
  "마지막",
  "끝없는",
  "붉은",
  "고요한",
  "부서진",
  "새벽의",
];

const SCENARIO_SUFFIX = [
  "왕국",
  "약속",
  "여행",
  "기록",
  "밤",
  "정원",
  "항해",
  "재회",
];

/** seed 기반 태그 2~3개 선택 */
const buildTags = (seed: number): string[] => {
  const count = randomInt(seed, 2, 3);

  return Array.from({ length: count }, (_, index) =>
    pickOne(seed + index * 7, TAG_POOL),
  ).filter((tag, index, tags) => tags.indexOf(tag) === index);
};

export const characters: Character[] = CHARACTER_NAMES.map((name, index) => {
  const seed = index + 1;
  const isOfficial = index % 6 === 0;

  return {
    characterId: seed,
    name,
    thumbnailUrl: `https://picsum.photos/seed/plat-character-${seed}/160/160`,
    creatorId: randomInt(seed * 3, 1, 8),
    creatorNickname: isOfficial
      ? "PLAT공식"
      : pickOne(seed * 5, CREATOR_NICKNAMES),
    isOfficial,
    visibility: index % 9 === 0 ? "HIDDEN" : "PUBLIC",
    status: index % 11 === 0 ? "BLOCKED" : "ACTIVE",
    isNsfw: index % 7 === 0,
    tags: buildTags(seed),
    scenarioCount: randomInt(seed * 2, 1, 5),
    assetCount: randomInt(seed * 4, 0, 48),
    chatCount: randomInt(seed * 6, 120, 48_000),
    likeCount: randomInt(seed * 8, 30, 12_000),
    createdAt: daysAgo(index * 3 + 2),
  };
});

/** 캐릭터당 1~3개의 세계관을 만든다. (실서비스는 최대 5개) */
export const scenarios: Scenario[] = characters.flatMap((character, index) =>
  Array.from({ length: randomInt(index + 3, 1, 3) }, (_, scenarioIndex) => {
    const seed = index * 10 + scenarioIndex + 1;

    return {
      scenarioId: seed,
      characterId: character.characterId,
      characterName: character.name,
      name: `${pickOne(seed, SCENARIO_PREFIX)} ${pickOne(seed * 3, SCENARIO_SUFFIX)}`,
      description:
        "오래전 봉인된 기억을 따라가며, 당신과 함께 잃어버린 조각을 되찾는 이야기입니다.",
      thumbnailUrl: `https://picsum.photos/seed/plat-scenario-${seed}/1200/440`,
      tags: buildTags(seed * 2),
      isOfficial: character.isOfficial,
      assetCount: randomInt(seed * 5, 0, 64),
      chatCount: randomInt(seed * 7, 80, 32_000),
      createdAt: daysAgo(index * 2 + scenarioIndex + 1),
    };
  }),
);

const CHARACTER_DESCRIPTION_POOL = [
  "왕국의 마지막 서기관. 사라진 기록을 좇으며 당신에게 진실의 조각을 건넨다.",
  "밤의 항구에서 배를 고치는 정비사. 말수는 적지만 손끝이 다정하다.",
  "학원 도서관의 터줏대감. 어떤 질문에도 책 한 권으로 답하려 한다.",
  "폐허가 된 연구소에 남은 관측자. 당신을 마지막 실험 대상이라 부른다.",
];

const CHARACTER_GREETING_POOL = [
  "…또 왔군요. 이번에는 얼마나 머물 생각인가요?",
  "늦었네요. 자리는 비워 뒀으니 편하게 앉아요.",
  "그 얼굴, 어디서 본 것 같은데요. 우리 만난 적 있나요?",
  "조용히 해 주세요. 지금은 아주 중요한 순간이거든요.",
];

const CHARACTER_PERSONALITY_POOL = [
  "차분하고 사려 깊다. 상대의 말을 끝까지 듣고 천천히 답한다.",
  "장난기가 많고 직설적이다. 마음에 든 상대일수록 더 짓궂게 군다.",
  "겉으로는 무뚝뚝하지만 상대의 사소한 변화를 먼저 알아챈다.",
  "호기심이 강하고 즉흥적이다. 결론보다 과정을 즐긴다.",
];

/**
 * 캐릭터 상세 전용 필드.
 * 목록 응답(Character)에는 포함되지 않으므로 시드를 분리해 둔다.
 */
export interface CharacterProfile {
  characterId: number;
  description: string;
  greeting: string;
  personality: string;
  updatedAt: string;
}

export const characterProfiles: CharacterProfile[] = characters.map(
  (character, index) => ({
    characterId: character.characterId,
    description: pickOne(index + 11, CHARACTER_DESCRIPTION_POOL),
    greeting: pickOne(index + 13, CHARACTER_GREETING_POOL),
    personality: pickOne(index + 17, CHARACTER_PERSONALITY_POOL),
    updatedAt: daysAgo(index + 1, 18),
  }),
);

export const nsfwKeywords: NsfwKeyword[] = [
  { keyword: "노출", level: "WARN" },
  { keyword: "폭력묘사", level: "BLOCK" },
  { keyword: "자해", level: "BLOCK" },
  { keyword: "미성년", level: "BLOCK" },
  { keyword: "혐오표현", level: "BLOCK" },
  { keyword: "선정적", level: "WARN" },
  { keyword: "약물", level: "WARN" },
].map((item, index) => ({
  keywordId: index + 1,
  keyword: item.keyword,
  level: item.level as NsfwKeyword["level"],
  hitCount: randomInt(index + 20, 0, 320),
  createdAt: daysAgo(index * 4 + 3),
}));

export const chatExportJobs: ChatExportJob[] = Array.from(
  { length: 6 },
  (_, index) => {
    const seed = index + 1;
    const character = characters[randomInt(seed * 3, 0, characters.length - 1)];
    const status = pickOne(seed, ["DONE", "DONE", "PROCESSING", "FAILED"] as const);

    return {
      jobId: seed,
      targetType: "CHARACTER" as const,
      targetId: character.characterId,
      targetName: character.name,
      startDate: daysAgo(index + 30),
      endDate: daysAgo(index),
      status,
      rowCount: status === "DONE" ? randomInt(seed * 9, 120, 8_400) : undefined,
      requestedBy: "운영자",
      createdAt: daysAgo(index, 15),
    };
  },
);
