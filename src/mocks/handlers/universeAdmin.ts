import { HttpResponse, delay, http } from "msw";
import { LIVE_BASE_URI } from "@/api/baseUri";
import type {
  Universe,
  UniverseCategory,
  UniverseScenario,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
} from "@/type/character";
import { universeScenarios, universes } from "../db/character";
import { hashtags } from "../db/hashtag";
import { MOCK_DELAY_MS, matchesKeyword } from "../utils";

/*
 * 세계관 운영 목업(보드 · 상세 · 운영 조치).
 *
 * 이 도메인도 실서버(plat-be `plat-admin`)에 연동해 두었지만, 서버를 띄우지 않고도
 * 화면을 돌릴 수 있도록 **다시 목업으로 세운다.** 그래서 목업 베이스가 아니라
 * **실서버 베이스에 등록한다.** 실서버를 다시 붙일 때는 이 파일과
 * handlers/index.ts의 등록 줄만 지우면 된다.
 *
 * 목록 경로가 큐레이션 후보 목록(`handlers/universe.ts`, 8080)과 같은 `/admin/universes`라
 * 오리진을 나눠 두어야 두 응답 모양이 충돌하지 않는다.
 *
 * 시드는 큐레이션과 **같은 `db/character`의 `universes`**를 쓴다. 보드에서 조치한 결과가
 * 큐레이션 후보 목록에도 그대로 반영되어야 두 화면이 어긋나지 않는다.
 *
 * 응답 모양은 화면 타입이 아니라 **서버 DTO를 그대로 흉내 낸다.** 이미지 URL이 늘 null인
 * 것도 실서버와 같다 — 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아 FileId → URL을
 * 해석하지 못하고, 화면은 함께 내려오는 FileId로 자리표시를 그린다.
 */

/** 목업에는 파일 ID가 없다. 세계관 ID로 만들어 자리표시가 안정적으로 보이게 한다. */
const fileIdOf = (seed: number) => String(700000000000000000 + seed);

/*
  번역 보유 언어는 세계관 시드(`supportedLanguages`)가 원본이다.
  여기서 따로 계산하면 **상세의 "번역 n개 언어"와 언어별 메인 노출 후보가 어긋난다.**
  영어 후보에는 떴는데 상세에는 영어 번역이 없는 세계관이 생기면 어느 쪽을 믿을지 알 수 없다.
*/
const translationCountOf = (universe: Universe) =>
  universe.supportedLanguages.length;

/*
  실서버 관리자 API는 파일 저장소를 스캔하지 않아 이 값이 항상 null이다.
  목업까지 null을 주면 목업 구간에서 이미지 관련 화면을 전혀 확인할 수 없어,
  여기서는 시드 썸네일을 실어 보낸다. 화면은 두 경우를 모두 처리해야 하므로
  **일부러 일부 세계관은 null로 남겨** 자리표시 경로도 함께 확인되게 한다.
*/
const mockProfileImageUrl = (universe: Universe): string | null =>
  universe.universeId % 7 === 0 ? null : universe.thumbnailUrl;

/* 에셋 검수 화면이 실제 운영 자료처럼 보이도록 이름과 상황을 돌려 쓴다. */
const ASSET_NAMES = [
  "첫 만남",
  "학교 옥상",
  "비 오는 골목",
  "카페 창가",
  "밤의 옥탑방",
  "졸업식",
];

const ASSET_SITUATIONS: (string | null)[] = [
  "주요 장면",
  null,
  "분기 진입",
  "엔딩 직전",
  null,
  "이벤트 한정",
];

const toItemResponse = (universe: Universe) => ({
  id: String(universe.universeId),
  title: universe.name,
  introduce: universe.description,
  category: universe.category,
  tendency: universe.tendency,
  visibility: universe.visibility,
  status: universe.status,
  reviewStatus: universe.reviewStatus,
  chatCount: universe.chatCount,
  likeCount: universe.likeCount,
  commentEnabled: universe.commentEnabled,
  creatorId: String(universe.creatorId),
  creatorNickname: universe.creatorNickname,
  profileImageFileId: fileIdOf(universe.universeId),
  profileImageUrl: mockProfileImageUrl(universe),
  hashtagCount: universe.tags.length,
  scenarioCount: universe.scenarioCount,
  translationCount: translationCountOf(universe),
  createdAt: universe.createdAt,
  updatedAt: universe.createdAt,
  deletedAt: universe.deletedAt ?? null,
  purgeAt: universe.purgeAt ?? null,
});

/** 세계관에 붙은 태그를 해시태그 목업에서 찾아 서버 DTO 모양으로 옮긴다. */
const toHashtagViews = (universe: Universe) =>
  universe.tags.map((label, index) => {
    const found = hashtags.find((hashtag) => hashtag.labels.KO === label);

    return {
      hashtagId: String(found?.hashtagId ?? 900000 + index),
      category: found?.category ?? "GENRE",
      label,
      isAdult: found?.isAdult ?? false,
      isEnabled: found?.isActive ?? true,
    };
  });

const toScenarioViews = (universeId: number) =>
  universeScenarios
    .filter((scenario) => scenario.universeId === universeId)
    .sort((a, b) => a.episodeNo - b.episodeNo)
    .map((scenario: UniverseScenario) => ({
      scenarioId: String(scenario.scenarioId),
      episodeNo: scenario.episodeNo,
      scenarioType: scenario.type,
      status: scenario.status,
      versionNo: scenario.versionNo,
      translations: [
        {
          language: "KO",
          title: scenario.title,
          /* 유저가 실제로 읽는 본문이다. 상황 설명 다음에 첫 대사가 온다. */
          content: `${scenario.situation}\n\n"${scenario.firstDialogue}"`,
        },
      ],
    }));

const toTranslationViews = (universe: Universe) => {
  const korean = {
    language: "KO",
    title: universe.name,
    introduce: universe.description,
    detailSetting:
      `${universe.name}의 상세 설정입니다. 유저에게는 보이지 않고 모델에게만 전달되는 프롬프트성 원문이라, ` +
      `선정성·프롬프트 인젝션 검수는 이 원문을 기준으로 합니다.`,
    description: universe.description,
  };

  return [
    korean,
    ...universe.supportedLanguages
      .filter((language) => language !== "KO")
      .map((language) => ({
        language,
        title: `Universe #${universe.universeId} (${language})`,
        introduce: `A ${language} introduction for this universe.`,
        detailSetting: `${language} detail setting used for the model prompt.`,
        description: `A ${language} description for this universe.`,
      })),
  ];
};

const toDetailResponse = (universe: Universe) => ({
  id: String(universe.universeId),
  creator: {
    creatorId: String(universe.creatorId),
    userId: String(600000000000000000 + universe.creatorId),
    nickname: universe.creatorNickname,
    grade: "REGULAR",
    status: "APPROVED",
  },
  category: universe.category,
  tendency: universe.tendency,
  visibility: universe.visibility,
  status: universe.status,
  reviewStatus: universe.reviewStatus,
  reviewRejectionReason: universe.reviewRejectionReason ?? null,
  commentEnabled: universe.commentEnabled,
  chatCount: universe.chatCount,
  likeCount: universe.likeCount,
  profileImageFileId: fileIdOf(universe.universeId),
  profileImageUrl: mockProfileImageUrl(universe),
  createdAt: universe.createdAt,
  updatedAt: universe.createdAt,
  deletedAt: universe.deletedAt ?? null,
  purgeAt: universe.purgeAt ?? null,
  purgedAt: universe.purgedAt ?? null,
  translations: toTranslationViews(universe),
  hashtags: toHashtagViews(universe),
  /* 파기된 세계관은 콘텐츠가 지워져 캐릭터도 남지 않는다. */
  character:
    universe.status === "PURGED"
      ? null
      : universe.characters[0]
        ? {
            characterId: String(universe.characters[0].characterId),
            name: universe.characters[0].name,
            profileImageFileId: fileIdOf(universe.characters[0].characterId),
            profileImageUrl: universe.characters[0].thumbnailUrl,
          }
        : null,
  assets:
    universe.status === "PURGED"
      ? []
      : Array.from({ length: Math.min(universe.assetCount, 12) }, (_, index) => ({
          assetId: String(universe.universeId * 100 + index),
          fileId: fileIdOf(universe.universeId * 100 + index),
          /*
            이름 풀이 6개뿐이라 에셋이 그보다 많으면 같은 이름이 반복된다.
            운영 화면에서 중복 자료로 오해하지 않도록 두 바퀴째부터 번호를 붙인다.
          */
          assetName:
            index < ASSET_NAMES.length
              ? ASSET_NAMES[index]
              : `${ASSET_NAMES[index % ASSET_NAMES.length]} ${Math.floor(index / ASSET_NAMES.length) + 1}`,
          assetSituation:
            ASSET_SITUATIONS[index % ASSET_SITUATIONS.length] ?? null,
          /*
            실서버는 null을 준다. 목업은 검수 화면(갤러리 · 확대 보기)을
            실제로 확인할 수 있도록 이미지를 싣되, 마지막 한 장은 null로 남겨
            자리표시가 섞여 나오는 모습까지 보이게 한다.
          */
          url:
            index === Math.min(universe.assetCount, 12) - 1
              ? null
              : `https://picsum.photos/seed/asset-${universe.universeId}-${index}/640/640`,
        })),
  scenarios: toScenarioViews(universe.universeId),
});

const findUniverse = (rawId: string) =>
  universes.find((universe) => String(universe.universeId) === rawId);

const notFound = () =>
  HttpResponse.json(
    { code: "UNIVERSE_NOT_FOUND", message: "세계관을 찾을 수 없습니다." },
    { status: 404 },
  );

interface UniversePatchBody {
  visibility?: UniverseVisibility;
  tendency?: UniverseTendency;
  category?: UniverseCategory;
  commentEnabled?: boolean;
  status?: UniverseStatus;
}

/** 운영이 직접 켜고 끄는 것은 ACTIVE ↔ INACTIVE 뿐이다. 삭제·파기는 배치가 소유한다. */
const OPERABLE_STATUSES: UniverseStatus[] = ["ACTIVE", "INACTIVE"];

export const universeAdminHandlers = [
  http.get(`${LIVE_BASE_URI}/admin/universes`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get("keyword") ?? "").trim();
    /* 서버는 0부터 센다. 화면이 1-base로 되돌린다. */
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

    let rows = [...universes];

    if (keyword) {
      rows = rows.filter((universe) =>
        matchesKeyword(
          keyword,
          universe.name,
          universe.description,
          String(universe.universeId),
        ),
      );
    }

    /*
      값이 하나로 딱 떨어지는 조건들. 크리에이터·해시태그 드릴다운도 여기 낀다 —
      목업이 이 둘을 안 걸러 주면 보드에서 "크리에이터 #123의 세계관만 보는 중"
      알림만 뜨고 목록은 전체가 나와, 링크가 동작하는지 확인할 수 없다.
      ID는 응답과 같은 문자열 기준으로 비교한다(Snowflake 규약).
    */
    const equals: [string, (universe: Universe) => string][] = [
      ["category", (universe) => universe.category],
      ["visibility", (universe) => universe.visibility],
      ["status", (universe) => universe.status],
      ["reviewStatus", (universe) => universe.reviewStatus],
      ["tendency", (universe) => universe.tendency],
      ["commentEnabled", (universe) => String(universe.commentEnabled)],
      ["creatorId", (universe) => String(universe.creatorId)],
    ];
    for (const [param, read] of equals) {
      const value = url.searchParams.get(param);
      if (value) rows = rows.filter((universe) => read(universe) === value);
    }

    /*
      해시태그 드릴다운. 목업 세계관은 태그를 ID가 아니라 한국어 라벨로 들고 있어
      해시태그 목업에서 라벨을 먼저 찾아 비교한다. 없는 ID면 빈 목록을 준다 —
      전체 목록을 돌려주면 "이 태그가 모든 세계관에 붙어 있다"로 읽힌다.
    */
    const hashtagId = url.searchParams.get("hashtagId");
    if (hashtagId) {
      const label = hashtags.find(
        (hashtag) => String(hashtag.hashtagId) === hashtagId,
      )?.labels.KO;

      rows = label
        ? rows.filter((universe) => universe.tags.includes(label))
        : [];
    }

    const compare: Record<string, (a: Universe, b: Universe) => number> = {
      CREATED_DESC: (a, b) => b.createdAt.localeCompare(a.createdAt),
      CREATED_ASC: (a, b) => a.createdAt.localeCompare(b.createdAt),
      CHAT_DESC: (a, b) => b.chatCount - a.chatCount,
      LIKE_DESC: (a, b) => b.likeCount - a.likeCount,
      TITLE_ASC: (a, b) => a.name.localeCompare(b.name),
      TITLE_DESC: (a, b) => b.name.localeCompare(a.name),
    };
    const order = url.searchParams.get("order") ?? "CREATED_DESC";
    rows.sort(compare[order] ?? compare.CREATED_DESC);

    const start = page * size;
    const content = rows.slice(start, start + size);

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      page: {
        number: page,
        size,
        numberOfElements: content.length,
        hasNext: start + size < rows.length,
        totalElements: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / size)),
        first: page === 0,
        last: start + size >= rows.length,
      },
      content: content.map(toItemResponse),
    });
  }),

  http.get(`${LIVE_BASE_URI}/admin/universes/:universeId`, async ({ params }) => {
    const universe = findUniverse(String(params.universeId));

    await delay(MOCK_DELAY_MS);

    if (!universe) return notFound();

    return HttpResponse.json(toDetailResponse(universe));
  }),

  /* 심사 처리. 반려는 사유가 반드시 있어야 하고 노출도 함께 내려간다. */
  http.patch(
    `${LIVE_BASE_URI}/admin/universes/:universeId/review`,
    async ({ params, request }) => {
      const universe = findUniverse(String(params.universeId));
      const body = (await request.json()) as {
        reviewStatus: Universe["reviewStatus"];
        reason?: string;
      };

      await delay(MOCK_DELAY_MS);

      if (!universe) return notFound();

      if (body.reviewStatus === "REJECTED") {
        if (!body.reason?.trim()) {
          return HttpResponse.json(
            {
              code: "UNIVERSE_REVIEW_REASON_REQUIRED",
              message: "반려 사유를 입력해주세요.",
            },
            { status: 400 },
          );
        }

        universe.reviewStatus = "REJECTED";
        universe.reviewRejectionReason = body.reason.trim();
        universe.visibility = "PRIVATE";
      } else {
        universe.reviewStatus = body.reviewStatus;
        universe.reviewRejectionReason = undefined;
      }

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.patch(
    `${LIVE_BASE_URI}/admin/universes/:universeId`,
    async ({ params, request }) => {
      const universe = findUniverse(String(params.universeId));
      const body = (await request.json()) as UniversePatchBody;

      await delay(MOCK_DELAY_MS);

      if (!universe) return notFound();

      if (body.status) {
        if (
          !OPERABLE_STATUSES.includes(universe.status) ||
          !OPERABLE_STATUSES.includes(body.status)
        ) {
          return HttpResponse.json(
            {
              code: "UNIVERSE_STATUS_TRANSITION_INVALID",
              message:
                "이 상태로는 바꿀 수 없습니다. 삭제·파기 상태는 운영에서 직접 바꾸지 않습니다.",
            },
            { status: 409 },
          );
        }
        universe.status = body.status;
      }

      if (body.visibility) universe.visibility = body.visibility;
      if (body.tendency) universe.tendency = body.tendency;
      if (body.category) universe.category = body.category;
      if (body.commentEnabled !== undefined) {
        universe.commentEnabled = body.commentEnabled;
      }

      return new HttpResponse(null, { status: 204 });
    },
  ),
];
