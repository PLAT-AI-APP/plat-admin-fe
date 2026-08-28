import { HttpResponse, delay, http } from "msw";
import type {
  CharacterDetailResponse,
  CharacterNsfwMatch,
} from "@/api/character/getCharacterDetail";
import type { CharacterSort } from "@/api/character/getCharacterList";
import type { CharacterStatusBody } from "@/api/character/mutateCharacter";
import type { ChatExportSchema } from "@/schema/chatExport.schema";
import type { BannedWordSchema } from "@/schema/bannedWord.schema";
import type { BannedWord, BannedWordLevel } from "@/type/bannedWord";
import type {
  Character,
  CharacterVisibility,
  ChatExportJob,
} from "@/type/character";
import {
  characterModerations,
  characterProfiles,
  characters,
  chatExportJobs,
  bannedWords,
  universes,
  syncCharacterDerivedCounts,
} from "../db/character";
import { stampAdmin } from "../session";
import {
  MOCK_DELAY_MS,
  matchesKeyword,
  nextId,
  paginate,
  randomInt,
} from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 내보내기 작업이 완료되기까지 걸리는 목업 처리 시간 */
const EXPORT_PROCESSING_MS = 2_500;

const findCharacter = (characterId: number) =>
  characters.find((character) => character.characterId === characterId);

const findProfile = (characterId: number) =>
  characterProfiles.find((profile) => profile.characterId === characterId);

const findModeration = (characterId: number) =>
  characterModerations.find((item) => item.characterId === characterId);

/** 삭제 처리된 캐릭터는 목록에서 제외한다. (실제 서버도 soft delete를 쓴다) */
const isListed = (character: Character) => character.status !== "DELETED";

/**
 * 목록 정렬.
 *
 * 어느 기준으로 정렬하든 **동점일 때의 순서가 흔들리면 안 된다.** 페이지를
 * 넘길 때 같은 행이 두 번 나오거나 빠지기 때문에, 마지막에는 항상 ID로 한 번
 * 더 갈라 준다.
 */
const SORT_COMPARATORS: Record<
  CharacterSort,
  (a: Character, b: Character) => number
> = {
  CREATED_DESC: (a, b) => b.createdAt.localeCompare(a.createdAt),
  CREATED_ASC: (a, b) => a.createdAt.localeCompare(b.createdAt),
  CHAT_DESC: (a, b) => b.chatCount - a.chatCount,
  LIKE_DESC: (a, b) => b.likeCount - a.likeCount,
  UNIVERSE_DESC: (a, b) => b.universeCount - a.universeCount,
  NAME_ASC: (a, b) => a.name.localeCompare(b.name, "ko"),
};

const sortCharacters = (rows: Character[], sort: string): Character[] => {
  const comparator =
    SORT_COMPARATORS[sort as CharacterSort] ?? SORT_COMPARATORS.CREATED_DESC;

  return [...rows].sort(
    (a, b) => comparator(a, b) || a.characterId - b.characterId,
  );
};

/** 캐릭터 목록 필터. 공식 여부는 공식 계정 지정에서 파생된 값을 그대로 본다. */
const filterCharacters = (url: URL): Character[] => {
  const keyword = url.searchParams.get("keyword") ?? "";
  const visibility = url.searchParams.get("visibility") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const isOfficial = url.searchParams.get("isOfficial") ?? "";
  const creatorId = url.searchParams.get("creatorId") ?? "";
  const sort = url.searchParams.get("sort") ?? "";

  const filtered = characters.filter((character) => {
    if (!isListed(character)) return false;

    if (creatorId && character.creatorId !== Number(creatorId)) return false;

    if (
      !matchesKeyword(
        keyword,
        character.name,
        character.creatorNickname,
        String(character.characterId),
        ...character.tags,
      )
    ) {
      return false;
    }

    if (visibility && character.visibility !== visibility) return false;

    // 노출 상태와 다른 축이다. 차단은 운영 조치라 따로 걸러 볼 수 있어야 한다.
    if (status && character.status !== status) return false;

    if (isOfficial) return character.isOfficial === (isOfficial === "true");

    return true;
  });

  return sortCharacters(filtered, sort);
};

/**
 * NSFW 판정 근거.
 *
 * 매칭 ID를 등록된 금지어 사전에서 다시 찾아 붙인다.
 * 단어가 삭제되면 근거에서도 사라져야 `/universes/banned-words` 화면과
 * 어긋나지 않는다. 레벨이 없는 예외어는 판정 근거가 될 수 없어 걸러진다.
 */
const buildNsfwMatches = (characterId: number): CharacterNsfwMatch[] => {
  const ids = findModeration(characterId)?.nsfwMatchedKeywordIds ?? [];

  return ids.flatMap((keywordId) => {
    const found = bannedWords.find((item) => item.bannedWordId === keywordId);

    return found?.level
      ? [{ keywordId, keyword: found.word, level: found.level }]
      : [];
  });
};

/** 상세 응답은 프로필 시드와 세계관 목록을 합쳐 만든다. */
const buildCharacterDetail = (
  character: Character,
): CharacterDetailResponse => {
  const profile = findProfile(character.characterId);
  const moderation = findModeration(character.characterId);

  return {
    ...character,
    description: profile?.description ?? "",
    greeting: profile?.greeting ?? "",
    personality: profile?.personality ?? "",
    nsfwMatches: buildNsfwMatches(character.characterId),
    blockedReason:
      character.status === "BLOCKED" ? moderation?.blockedReason : undefined,
    blockedAt:
      character.status === "BLOCKED" ? moderation?.blockedAt : undefined,
    /*
      목업은 URL을 주고 fileId는 주지 않는다. 실서버는 반대다.
      화면이 두 경우를 모두 그리는지 확인하려고 필드를 명시적으로 남겨 둔다.
    */
    profileImageFileId: null,
    /*
      이 캐릭터가 **등장하는** 세계관. 소유가 아니라 등장 기준이라, 다른 크리에이터의
      세계관에 초대된 경우도 함께 나온다.
      삭제·파기된 세계관은 목록 지표에서도 빠지므로 여기서도 뺀다.
    */
    universes: universes.filter(
      (universe) =>
        universe.characters.some(
          (item) => item.characterId === character.characterId,
        ) &&
        universe.status !== "DELETED" &&
        universe.status !== "PURGED",
    ),
    updatedAt: profile?.updatedAt ?? character.createdAt,
  };
};

const notFound = (message: string) =>
  HttpResponse.json({ code: "NOT_FOUND", message }, { status: 404 });

export const characterHandlers = [
  http.get(`${BASE_URI}/admin/characters`, async ({ request }) => {
    const url = new URL(request.url);

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filterCharacters(url), url));
  }),

  http.get(`${BASE_URI}/admin/characters/:characterId`, async ({ params }) => {
    const character = findCharacter(Number(params.characterId));

    await delay(MOCK_DELAY_MS);

    if (!character) return notFound("존재하지 않는 캐릭터입니다.");

    return HttpResponse.json(buildCharacterDetail(character));
  }),

  http.patch(
    `${BASE_URI}/admin/characters/:characterId/visibility`,
    async ({ params, request }) => {
      const character = findCharacter(Number(params.characterId));
      const { visibility } = (await request.json()) as {
        visibility: CharacterVisibility;
      };

      if (!character) return notFound("존재하지 않는 캐릭터입니다.");

      character.visibility = visibility;
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(character);
    },
  ),

  /*
    차단 · 차단 해제.

    차단은 앱에서 즉시 내리는 조치라 노출 상태도 함께 숨김으로 내린다.
    해제할 때 공개로 되돌리지 않는 이유는, 차단 전에 크리에이터가 스스로
    숨김으로 두었을 수도 있기 때문이다. 노출은 운영자가 따로 판단해 올린다.
  */
  http.patch(
    `${BASE_URI}/admin/characters/:characterId/status`,
    async ({ params, request }) => {
      const character = findCharacter(Number(params.characterId));
      const body = (await request.json()) as CharacterStatusBody;

      if (!character) return notFound("존재하지 않는 캐릭터입니다.");

      if (character.status === "DELETED") {
        return HttpResponse.json(
          {
            code: "CHARACTER_DELETED",
            message: "이미 삭제된 캐릭터는 상태를 바꿀 수 없습니다.",
          },
          { status: 409 },
        );
      }

      const moderation = findModeration(character.characterId);

      character.status = body.status;

      if (body.status === "BLOCKED") {
        character.visibility = "HIDDEN";

        if (moderation) {
          moderation.blockedReason = body.reason;
          moderation.blockedAt = new Date().toISOString();
        }
      } else if (moderation) {
        moderation.blockedReason = undefined;
        moderation.blockedAt = undefined;
      }

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(character);
    },
  ),

  http.delete(
    `${BASE_URI}/admin/characters/:characterId`,
    async ({ params }) => {
      const character = findCharacter(Number(params.characterId));

      if (!character) return notFound("존재하지 않는 캐릭터입니다.");

      // 세계관·배너가 참조 중이므로 배열에서 제거하지 않고 비활성 처리한다.
      character.status = "DELETED";
      character.visibility = "HIDDEN";

      // 목록에서 빠지므로 크리에이터의 보유 캐릭터 수·해시태그 사용 수도 함께 줄인다.
      syncCharacterDerivedCounts();

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.get(`${BASE_URI}/admin/banned-words`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const level = url.searchParams.get("level") ?? "";

    const filtered = bannedWords.filter((item) => {
      if (type && item.type !== type) return false;
      if (level && item.level !== level) return false;

      return matchesKeyword(keyword, item.word);
    });

    // 적중이 많은 것부터. 이 표를 여는 이유는 대개 과하게 걸리는 단어를 찾기 위해서다.
    const sorted = [...filtered].sort(
      (a, b) => b.hitCount - a.hitCount || b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.post(`${BASE_URI}/admin/banned-words`, async ({ request }) => {
    const body = (await request.json()) as BannedWordSchema;
    const word = body.word.trim();
    // 한 단어가 금지어이면서 예외어일 수는 없으므로 유형과 무관하게 단어 자체가 유일하다.
    const isDuplicated = bannedWords.some((item) => item.word === word);

    await delay(MOCK_DELAY_MS);

    if (isDuplicated) {
      return HttpResponse.json(
        { code: "BANNED_WORD_DUPLICATED", message: "이미 등록된 단어입니다." },
        { status: 409 },
      );
    }

    const registrar = stampAdmin();
    const created: BannedWord = {
      bannedWordId: nextId(bannedWords, "bannedWordId"),
      word,
      type: body.type,
      level: body.type === "BAN" ? body.level : undefined,
      hitCount: 0,
      createdBy: registrar.name,
      createdById: registrar.managerId,
      createdAt: new Date().toISOString(),
    };

    bannedWords.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(
    `${BASE_URI}/admin/banned-words/:bannedWordId/level`,
    async ({ params, request }) => {
      const bannedWordId = Number(params.bannedWordId);
      const { level } = (await request.json()) as { level: BannedWordLevel };
      const found = bannedWords.find(
        (item) => item.bannedWordId === bannedWordId,
      );

      await delay(MOCK_DELAY_MS);

      if (!found) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "존재하지 않는 단어입니다." },
          { status: 404 },
        );
      }

      found.level = level;

      return HttpResponse.json(found);
    },
  ),

  http.delete(
    `${BASE_URI}/admin/banned-words/:bannedWordId`,
    async ({ params }) => {
      const bannedWordId = Number(params.bannedWordId);
      const index = bannedWords.findIndex(
        (item) => item.bannedWordId === bannedWordId,
      );

      if (index >= 0) bannedWords.splice(index, 1);

      await delay(MOCK_DELAY_MS);

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.get(`${BASE_URI}/admin/chat-exports`, async ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "";

    const filtered = chatExportJobs.filter(
      (job) => !status || job.status === status,
    );
    const sorted = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.post(`${BASE_URI}/admin/chat-exports`, async ({ request }) => {
    const body = (await request.json()) as ChatExportSchema;
    const character = findCharacter(body.targetId);

    await delay(MOCK_DELAY_MS);

    if (!character) return notFound("존재하지 않는 캐릭터입니다.");

    const created: ChatExportJob = {
      jobId: nextId(chatExportJobs, "jobId"),
      targetType: body.targetType,
      targetId: body.targetId,
      targetName: character.name,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "PROCESSING",
      requestedBy: "운영자",
      createdAt: new Date().toISOString(),
    };

    chatExportJobs.push(created);

    // 실제 서버는 비동기 배치로 처리한다. 목업도 잠시 뒤 완료 상태로 바꾼다.
    setTimeout(() => {
      created.status = "DONE";
      created.rowCount = randomInt(created.jobId * 11, 120, 8_400);
    }, EXPORT_PROCESSING_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${BASE_URI}/admin/chat-exports/:jobId`, async ({ params }) => {
    const jobId = Number(params.jobId);
    const job = chatExportJobs.find((item) => item.jobId === jobId);

    await delay(MOCK_DELAY_MS);

    if (!job) return notFound("존재하지 않는 작업입니다.");

    return HttpResponse.json(job);
  }),
];
