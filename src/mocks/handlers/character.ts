import { HttpResponse, delay, http } from "msw";
import type { ChatExportSchema } from "@/schema/chatExport.schema";
import type { NsfwKeywordSchema } from "@/schema/nsfwKeyword.schema";
import type {
  Character,
  CharacterDetail,
  CharacterVisibility,
  ChatExportJob,
  NsfwKeyword,
} from "@/type/character";
import {
  characterProfiles,
  characters,
  chatExportJobs,
  nsfwKeywords,
  universes,
  syncCharacterDerivedCounts,
} from "../db/character";
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

/** 삭제 처리된 캐릭터는 목록에서 제외한다. (실제 서버도 soft delete를 쓴다) */
const isListed = (character: Character) => character.status !== "DELETED";

/** 캐릭터 목록 필터. 공식 여부는 공식 계정 지정에서 파생된 값을 그대로 본다. */
const filterCharacters = (url: URL): Character[] => {
  const keyword = url.searchParams.get("keyword") ?? "";
  const visibility = url.searchParams.get("visibility") ?? "";
  const isOfficial = url.searchParams.get("isOfficial") ?? "";
  const creatorId = url.searchParams.get("creatorId") ?? "";

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

    if (isOfficial) return character.isOfficial === (isOfficial === "true");

    return true;
  });

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/** 상세 응답은 프로필 시드와 세계관 목록을 합쳐 만든다. */
const buildCharacterDetail = (character: Character): CharacterDetail => {
  const profile = findProfile(character.characterId);

  return {
    ...character,
    description: profile?.description ?? "",
    greeting: profile?.greeting ?? "",
    personality: profile?.personality ?? "",
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

  http.get(`${BASE_URI}/admin/nsfw-keywords`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const level = url.searchParams.get("level") ?? "";

    const filtered = nsfwKeywords.filter((item) => {
      if (level && item.level !== level) return false;

      return matchesKeyword(keyword, item.keyword);
    });

    const sorted = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.post(`${BASE_URI}/admin/nsfw-keywords`, async ({ request }) => {
    const body = (await request.json()) as NsfwKeywordSchema;
    const isDuplicated = nsfwKeywords.some(
      (item) => item.keyword === body.keyword,
    );

    await delay(MOCK_DELAY_MS);

    if (isDuplicated) {
      return HttpResponse.json(
        {
          code: "KEYWORD_DUPLICATED",
          message: "이미 등록된 키워드입니다.",
        },
        { status: 409 },
      );
    }

    const created: NsfwKeyword = {
      keywordId: nextId(nsfwKeywords, "keywordId"),
      keyword: body.keyword,
      level: body.level,
      hitCount: 0,
      createdAt: new Date().toISOString(),
    };

    nsfwKeywords.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(
    `${BASE_URI}/admin/nsfw-keywords/:keywordId`,
    async ({ params }) => {
      const keywordId = Number(params.keywordId);
      const index = nsfwKeywords.findIndex(
        (item) => item.keywordId === keywordId,
      );

      if (index >= 0) nsfwKeywords.splice(index, 1);

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
