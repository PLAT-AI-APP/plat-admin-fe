import type {
  Character,
  ChatExportJob,
  ScenarioLifecycle,
  ScenarioType,
  Universe,
  UniverseCategory,
  UniverseReviewStatus,
  UniverseScenario,
  UniverseStatus,
  UniverseTendency,
} from "@/type/character";
import type { ServiceLanguage } from "@/type/language";
import type { BannedWord, BannedWordType } from "@/type/bannedWord";
import { daysAgo, pickOne, randomInt } from "../utils";
import { pickManager } from "./ops";
import { CHARACTER_TAG_POOL, hashtags } from "./hashtag";
import { creatorUsers, officialCreatorUsers, users } from "./user";

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

const UNIVERSE_PREFIX = [
  "잊혀진",
  "달빛 아래",
  "마지막",
  "끝없는",
  "붉은",
  "고요한",
  "부서진",
  "새벽의",
];

const UNIVERSE_SUFFIX = [
  "왕국",
  "약속",
  "여행",
  "기록",
  "밤",
  "정원",
  "항해",
  "재회",
];

/** seed 기반 태그 2~3개 선택. 등록된 해시태그에서만 고른다. */
const buildTags = (seed: number): string[] => {
  const count = randomInt(seed, 2, 3);

  return Array.from({ length: count }, (_, index) =>
    pickOne(seed + index * 7, CHARACTER_TAG_POOL),
  ).filter((tag, index, tags) => tags.indexOf(tag) === index);
};

/**
 * 언어별 번역 보유율(%).
 *
 * **모든 세계관이 6개 언어를 다 갖춘 시드를 넣으면 안 된다.** 그러면 언어별
 * 후보 목록이 전부 똑같아져서, 언어를 나눈 이유(영어 번역이 없는 세계관은
 * 영어 목록에 못 오른다)가 화면에서 확인되지 않는다.
 */
const TRANSLATION_RATE: Record<Exclude<ServiceLanguage, "KO">, number> = {
  EN: 62,
  JA: 45,
  ZH: 30,
  TH: 20,
  VI: 14,
};

/** seed 기반 번역 보유 언어. 한국어는 원문이라 항상 있다. */
const buildSupportedLanguages = (seed: number): ServiceLanguage[] => [
  "KO",
  ...Object.entries(TRANSLATION_RATE)
    .filter(
      ([, rate], index) => randomInt(seed * 13 + index * 7, 0, 99) < rate,
    )
    .map(([language]) => language as ServiceLanguage),
];

/** 캐릭터가 만들어진 날. 세계관 등록일이 이보다 앞서지 않도록 여기서 한 번만 계산한다. */
const characterCreatedDaysAgo = (index: number) => index * 3 + 2;

/**
 * 지표(세계관 수·에셋·대화)를 뺀 캐릭터 기본 정보.
 * 지표는 하위 세계관이 만들어진 뒤에 합산해야 하므로 2단계로 나눈다.
 */
const characterBases = CHARACTER_NAMES.map((name, index) => {
  const seed = index + 1;
  // 운영 계정이 만든 캐릭터를 섞어 둔다. 공식 여부는 db/official이 판정한다.
  const isOperated = index % 6 === 0;
  const creator = isOperated
    ? pickOne(seed * 3, officialCreatorUsers)
    : pickOne(seed * 3, creatorUsers);
  const status = index % 11 === 0 ? "BLOCKED" : "ACTIVE";

  return {
    characterId: seed,
    name,
    thumbnailUrl: `https://picsum.photos/seed/plat-character-${seed}/160/160`,
    creatorId: creator.userId,
    creatorNickname: creator.nickname,
    /* 공식 여부는 공식 계정 목록에서 파생된다. db/official의 syncOfficialFlags가 채운다. */
    isOfficial: false,
    // 차단된 캐릭터가 앱에 계속 공개돼 있으면 안 된다.
    visibility:
      status === "BLOCKED" || index % 9 === 0
        ? ("HIDDEN" as const)
        : ("PUBLIC" as const),
    status: status as Character["status"],
    isNsfw: index % 7 === 0,
    tags: buildTags(seed),
    likeCount: randomInt(seed * 8, 30, 12_000),
    createdAt: daysAgo(characterCreatedDaysAgo(index)),
  };
});

const UNIVERSE_CATEGORIES: readonly UniverseCategory[] = [
  "ROMANCE",
  "FANTASY",
  "DRAMA",
  "MARTIAL_ARTS",
  "GL",
  "BL",
  "HORROR",
  "MYSTERY",
];

const UNIVERSE_TENDENCIES: readonly UniverseTendency[] = [
  "ALL",
  "MALE_ORIENTED",
  "FEMALE_ORIENTED",
];

const REVIEW_REJECTION_REASONS = [
  "타인의 저작물로 보이는 이미지가 포함되어 있습니다.",
  "설명에 선정적인 표현이 있어 수정이 필요합니다.",
  "제목과 내용이 서로 맞지 않습니다.",
];

/**
 * 세계관 ↔ 캐릭터 매핑. 서버 `universe_character_mappings`에 해당한다.
 *
 * **N:M이다.** 세계관 하나에 캐릭터가 여럿 나올 수 있고, 같은 캐릭터가 다른
 * 세계관에도 등장한다. 매핑을 따로 두지 않고 세계관에 캐릭터 하나를 박아 두면
 * "이 캐릭터가 어디에 나오나"를 셀 수 없다.
 */
const universeCharacterIds = (seed: number, ownerIndex: number): number[] => {
  const owner = characterBases[ownerIndex].characterId;
  // 3번에 한 번꼴로 다른 세계관의 캐릭터가 함께 등장한다.
  const hasGuest = seed % 3 === 0;
  const guest =
    characterBases[(ownerIndex + randomInt(seed, 1, 5)) % characterBases.length]
      .characterId;

  return hasGuest && guest !== owner ? [owner, guest] : [owner];
};

/** 캐릭터당 1~3개의 세계관을 만든다. (실서비스는 최대 5개) */
export const universes: Universe[] = characterBases.flatMap(
  (character, index) =>
    Array.from({ length: randomInt(index + 3, 1, 3) }, (_, universeIndex) => {
      const seed = index * 10 + universeIndex + 1;
      // 세계관은 캐릭터가 만들어진 뒤에 등록된다.
      const createdDaysAgo = Math.max(
        0,
        characterCreatedDaysAgo(index) - universeIndex - 1,
      );

      /*
        심사·운영 상태를 섞어 둔다. 서버는 승인되지 않았거나 내려둔 세계관을
        홈 섹션에서 빼기 때문에, 운영 화면에서 그 이유를 구분할 수 있어야 한다.

        삭제는 하드 딜리트라 상태로 남지 않는다 — 지운 세계관은 자료에서 통째로
        사라지므로 목업도 살아 있는 것만 만든다.
      */
      const reviewStatus: UniverseReviewStatus =
        seed % 17 === 0 ? "REJECTED" : seed % 9 === 0 ? "PENDING" : "APPROVED";
      const status: UniverseStatus = seed % 19 === 0 ? "INACTIVE" : "ACTIVE";

      return {
        universeId: seed,
        characters: universeCharacterIds(seed, index).map((characterId) => {
          const item = characterBases.find(
            (base) => base.characterId === characterId,
          )!;

          return {
            characterId: item.characterId,
            name: item.name,
            // 캐릭터 프로필 이미지는 세계관 대표 이미지와 따로 올린다.
            thumbnailUrl: item.thumbnailUrl,
          };
        }),
        creatorId: character.creatorId,
        creatorNickname: character.creatorNickname,
        name: `${pickOne(seed, UNIVERSE_PREFIX)} ${pickOne(seed * 3, UNIVERSE_SUFFIX)}`,
        description:
          "오래전 봉인된 기억을 따라가며, 당신과 함께 잃어버린 조각을 되찾는 이야기입니다.",
        thumbnailUrl: `https://picsum.photos/seed/plat-universe-${seed}/1200/440`,
        tags: buildTags(seed * 2),
        supportedLanguages: buildSupportedLanguages(seed),
        /* 공식 여부는 공식 계정 목록에서 파생된다. db/official의 syncOfficialFlags가 채운다. */
        isOfficial: false,
        visibility:
          status === "ACTIVE"
            ? seed % 11 === 0
              ? ("UNLISTED" as const)
              : ("PUBLIC" as const)
            : ("PRIVATE" as const),
        status,
        category: pickOne(seed * 2, UNIVERSE_CATEGORIES),
        tendency: pickOne(seed * 4, UNIVERSE_TENDENCIES),
        reviewStatus,
        reviewRejectionReason:
          reviewStatus === "REJECTED"
            ? pickOne(seed, REVIEW_REJECTION_REASONS)
            : undefined,
        commentEnabled: seed % 5 !== 0,
        assetCount: randomInt(seed * 5, 0, 64),
        // 시나리오는 아래에서 만든다. 수는 그 결과와 맞춰 다시 채운다.
        scenarioCount: 0,
        chatCount: randomInt(seed * 7, 80, 32_000),
        likeCount: randomInt(seed * 9, 0, 9_400),
        createdAt: daysAgo(createdDaysAgo),
      };
    }),
);

/* -------------------------------------------------------------------------
 * 시나리오 (세계관 안의 에피소드)
 * ---------------------------------------------------------------------- */

const SCENARIO_TITLES = [
  "첫 만남",
  "비 오는 밤의 약속",
  "잊고 있던 이름",
  "사라진 편지",
  "마지막 선택",
  "돌아온 자리",
];

const SCENARIO_SITUATIONS = [
  "늦은 밤 도서관, 마지막까지 남은 두 사람이 마주친다.",
  "폐허가 된 정원에서 오래된 상자를 함께 열어 본다.",
  "떠나기 전날, 아무 말도 못 하고 문 앞에 서 있다.",
  "축제 인파 속에서 손을 놓쳤다가 겨우 다시 만난다.",
];

const SCENARIO_FIRST_DIALOGUES = [
  "…또 여기 있었네요. 오늘은 무슨 일이에요?",
  "늦었어요. 그래도 기다렸으니까 됐어요.",
  "이 얘기, 지금 아니면 못 할 것 같아서요.",
  "잠깐만요. 손 좀 잡아도 될까요? 사람이 너무 많아서.",
];

/**
 * 세계관당 시나리오 1~4편.
 *
 * 1편은 반드시 `START`다. 시작 시나리오가 없으면 유저가 세계관에 들어와도
 * 고를 것이 없다 — 실제 서비스에서 있을 수 없는 상태라 목업에서도 만들지 않는다.
 */
export const universeScenarios: UniverseScenario[] = universes.flatMap(
  (universe, index) =>
    Array.from({ length: randomInt(index + 5, 1, 4) }, (_, episodeIndex) => {
      const seed = universe.universeId * 10 + episodeIndex + 1;
      const isStart = episodeIndex === 0;

      const type: ScenarioType = isStart
        ? "START"
        : seed % 11 === 0
          ? "ENDING"
          : seed % 7 === 0
            ? "EVENT"
            : "NORMAL";

      /* 구버전·숨김을 섞어 둔다. 시작 시나리오는 항상 살아 있어야 한다. */
      const status: ScenarioLifecycle = isStart
        ? "ACTIVE"
        : seed % 13 === 0
          ? "DEPRECATED"
          : seed % 9 === 0
            ? "HIDDEN"
            : "ACTIVE";

      return {
        scenarioId: seed,
        universeId: universe.universeId,
        episodeNo: episodeIndex + 1,
        type,
        status,
        versionNo: status === "DEPRECATED" ? 1 : randomInt(seed, 1, 3),
        title: pickOne(seed, SCENARIO_TITLES),
        situation: pickOne(seed * 3, SCENARIO_SITUATIONS),
        firstDialogue: pickOne(seed * 5, SCENARIO_FIRST_DIALOGUES),
        createdAt: universe.createdAt,
      };
    }),
);

/* 세계관의 시나리오 수는 실제 시나리오에서 센다. 따로 난수를 뿌리면 바로 어긋난다. */
universes.forEach((universe) => {
  universe.scenarioCount = universeScenarios.filter(
    (scenario) =>
      scenario.universeId === universe.universeId &&
      scenario.status !== "DEPRECATED",
  ).length;
});

/**
 * 캐릭터 지표는 하위 세계관의 합이다.
 * 상세 화면에서 캐릭터 지표와 세계관 목록이 나란히 보이므로 따로 난수를 뿌리면 바로 어긋난다.
 */
/**
 * 캐릭터 지표는 **그 캐릭터가 등장하는 세계관**의 합이다.
 * 소유가 아니라 등장 기준이라, 다른 사람의 세계관에 초대된 캐릭터도 함께 잡힌다.
 */
export const characters: Character[] = characterBases.map((character) => {
  const appearedUniverses = universes.filter((universe) =>
    universe.characters.some(
      (item) => item.characterId === character.characterId,
    ),
  );

  return {
    ...character,
    universeCount: appearedUniverses.length,
    assetCount: appearedUniverses.reduce(
      (sum, item) => sum + item.assetCount,
      0,
    ),
    chatCount: appearedUniverses.reduce((sum, item) => sum + item.chatCount, 0),
  };
});

/**
 * 캐릭터에서 파생되는 다른 도메인의 집계값을 다시 계산한다.
 * 캐릭터가 추가·삭제되거나 태그가 바뀌면 핸들러에서 다시 불러 준다.
 */
export const syncCharacterDerivedCounts = () => {
  // 삭제된 캐릭터는 목록에서 빠지므로 집계에서도 뺀다.
  const listed = characters.filter(
    (character) => character.status !== "DELETED",
  );

  // 해시태그의 "사용 수"는 실제로 그 태그를 달고 있는 캐릭터·세계관의 수다.
  hashtags.forEach((hashtag) => {
    const label = hashtag.labels.KO;

    hashtag.usageCount =
      listed.filter((character) => character.tags.includes(label)).length +
      universes.filter((universe) => universe.tags.includes(label)).length;
  });

  // 유저의 "캐릭터 수"는 그 유저가 크리에이터로 등록한 캐릭터의 수다.
  users.forEach((user) => {
    user.characterCount = listed.filter(
      (character) => character.creatorId === user.userId,
    ).length;
  });
};

syncCharacterDerivedCounts();

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

/**
 * 금지어 사전 시드.
 *
 * 금지어와 예외어를 함께 둔다. '졸라'를 막고 '고르곤졸라'를 풀어 주는 짝이 실제로
 * 어떻게 동작하는지는 두 종류가 같이 있어야만 화면에서 확인할 수 있다.
 */
const BANNED_WORD_SEEDS: { word: string; type: BannedWordType }[] = [
  { word: "노출", type: "BAN" },
  { word: "폭력묘사", type: "BAN" },
  { word: "자해", type: "BAN" },
  { word: "미성년", type: "BAN" },
  { word: "혐오표현", type: "BAN" },
  { word: "선정적", type: "BAN" },
  { word: "약물", type: "BAN" },
  { word: "졸라", type: "BAN" },
  { word: "고르곤졸라", type: "EXCEPT" },
  { word: "노출 콘크리트", type: "EXCEPT" },
];

export const bannedWords: BannedWord[] = BANNED_WORD_SEEDS.map(
  (seed, index) => {
    const registrar = pickManager(index + 20);

    return {
      bannedWordId: index + 1,
      word: seed.word,
      type: seed.type,
      createdBy: registrar.name,
      createdById: registrar.managerId,
      createdAt: daysAgo(index * 4 + 3),
    };
  },
);

/** 금지어(BAN)만. NSFW 판정 근거는 걸러 내는 쪽에서만 나온다. */
export const banOnlyWords = bannedWords.filter((item) => item.type === "BAN");

/**
 * 캐릭터 검수 부가 정보.
 *
 * **`Character`에 필드를 더하지 않고 옆 테이블로 둔다.** 캐릭터 시드는
 * 신고 · 공식 계정 · 댓글 · 전역 검색이 함께 읽는 공용 데이터라, 여기에
 * 화면 하나가 필요한 필드를 얹으면 그 도메인들이 모두 영향을 받는다.
 * 실서버에도 캐릭터 검수 API가 아직 없어(`CharacterController`는 빈 껍데기)
 * 어차피 별도 응답으로 붙을 값들이다.
 */
export interface CharacterModeration {
  characterId: number;
  /**
   * NSFW 판정에 걸린 금지어. `Character.isNsfw`가 참인 근거다.
   *
   * 뱃지만 있고 근거가 없으면 운영자가 오탐을 판단할 수 없다.
   * 값은 `bannedWords`(= `/universes/banned-words` 화면)에서만 고른다.
   * 등록된 사전과 어긋나면 "이 단어로 걸렸다"는 말이 성립하지 않는다.
   */
  nsfwMatchedKeywordIds: number[];
  /** 차단 사유. `status`가 `BLOCKED`일 때만 있다. */
  blockedReason?: string;
  blockedAt?: string;
}

const CHARACTER_BLOCK_REASONS = [
  "타 IP 캐릭터를 그대로 옮긴 것으로 확인되어 차단했습니다.",
  "미성년으로 읽히는 설정과 선정적 묘사가 함께 있어 차단했습니다.",
  "신고 누적으로 검수 전까지 노출을 중단했습니다.",
];

export const characterModerations: CharacterModeration[] = characters.map(
  (character, index) => {
    const seed = index + 1;
    /*
      NSFW로 걸린 캐릭터만 매칭 금지어를 갖는다. 1~2개를 고른다.
      걸리지 않은 캐릭터에 금지어를 붙이면 뱃지와 근거가 어긋난다.
    */
    const matchCount = character.isNsfw ? randomInt(seed * 31, 1, 2) : 0;
    const nsfwMatchedKeywordIds = Array.from(
      { length: matchCount },
      (_, matchIndex) =>
        pickOne(seed * 37 + matchIndex * 13, banOnlyWords).bannedWordId,
    ).filter((id, idx, ids) => ids.indexOf(id) === idx);

    const isBlocked = character.status === "BLOCKED";

    return {
      characterId: character.characterId,
      nsfwMatchedKeywordIds,
      blockedReason: isBlocked
        ? pickOne(seed * 41, CHARACTER_BLOCK_REASONS)
        : undefined,
      blockedAt: isBlocked ? daysAgo(index + 2, 16) : undefined,
    };
  },
);

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
