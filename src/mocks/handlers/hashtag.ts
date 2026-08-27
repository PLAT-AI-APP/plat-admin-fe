import { HttpResponse, delay, http } from "msw";
import { LIVE_BASE_URI } from "@/api/baseUri";
import type { HashtagCategory, HashtagLanguage } from "@/type/hashtag";
import { hashtags, type MockHashtag } from "../db/hashtag";
import { MOCK_DELAY_MS, nextId } from "../utils";

/*
 * 해시태그 목업.
 *
 * 이 도메인은 실서버(plat-be `plat-admin`)에 연동해 두었지만, 서버를 띄우지 않고도
 * 화면을 돌릴 수 있도록 **다시 목업으로 세운다.** 그래서 목업 베이스가 아니라
 * **실서버 베이스에 등록한다** — `src/api/hashtag/*`가 `liveAxios`로 그대로
 * 부르고, 실서버를 다시 붙일 때는 이 파일과 handlers/index.ts의 등록 줄만 지우면 된다.
 *
 * 응답 모양은 화면 타입이 아니라 **서버 DTO를 그대로 흉내 낸다.** 그래야
 * `src/api/hashtag/*`의 DTO → 화면 타입 변환이 실제와 같은 경로로 검증된다.
 */

/** 서버는 언어별 라벨을 언어 코드 필드로 내려준다. 비어 있으면 null이다. */
const labelOf = (hashtag: MockHashtag, language: HashtagLanguage) =>
  hashtag.labels[language]?.trim() ? hashtag.labels[language] : null;

/** 서버 `HashtagResponse`. 목록에는 한국어 라벨과 번역 개수만 온다. */
const toItemResponse = (hashtag: MockHashtag) => ({
  id: String(hashtag.hashtagId),
  name: hashtag.labels.KO,
  category: hashtag.category,
  translationCount: (
    ["KO", "EN", "JA", "ZH", "TH", "VI"] as HashtagLanguage[]
  ).filter((language) => hashtag.labels[language]?.trim()).length,
  totalTranslationCount: 6,
  usingCount: hashtag.usageCount,
  createdAt: hashtag.createdAt,
  isAdult: hashtag.isAdult,
  isEnabled: hashtag.isActive,
});

/** 서버 `HashtagDetailResponse`. 상세에서만 언어별 라벨이 온다. */
const toDetailResponse = (hashtag: MockHashtag) => ({
  id: String(hashtag.hashtagId),
  category: hashtag.category,
  ko: hashtag.labels.KO,
  en: labelOf(hashtag, "EN"),
  ja: labelOf(hashtag, "JA"),
  zh: labelOf(hashtag, "ZH"),
  th: labelOf(hashtag, "TH"),
  vi: labelOf(hashtag, "VI"),
  createdAt: hashtag.createdAt,
  isAdult: hashtag.isAdult,
  isEnabled: hashtag.isActive,
});

interface HashtagRequestBody {
  category: HashtagCategory;
  ko: string;
  en: string;
  ja: string;
  zh: string;
  th: string;
  vi: string;
  isAdult: boolean;
  isEnabled: boolean;
}

const findHashtag = (rawId: string) =>
  hashtags.find((hashtag) => String(hashtag.hashtagId) === rawId);

const notFound = () =>
  HttpResponse.json(
    { code: "HASHTAG_NOT_FOUND", message: "해시태그를 찾을 수 없습니다." },
    { status: 404 },
  );

export const hashtagHandlers = [
  http.get(`${LIVE_BASE_URI}/admin/hashtags`, async ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const isEnabled = url.searchParams.get("isEnabled");
    const isAdult = url.searchParams.get("isAdult");
    const sort = url.searchParams.get("sort");

    let rows = [...hashtags];
    if (category) rows = rows.filter((row) => row.category === category);
    if (isEnabled) rows = rows.filter((row) => String(row.isActive) === isEnabled);
    if (isAdult) rows = rows.filter((row) => String(row.isAdult) === isAdult);

    /* 검색어·페이징은 서버가 하지 않는다. 화면이 받아 온 뒤 직접 처리한다. */
    const compare: Record<string, (a: MockHashtag, b: MockHashtag) => number> = {
      CREATED_DESC: (a, b) => b.createdAt.localeCompare(a.createdAt),
      CREATED_ASC: (a, b) => a.createdAt.localeCompare(b.createdAt),
      USAGE_DESC: (a, b) => b.usageCount - a.usageCount,
      USAGE_ASC: (a, b) => a.usageCount - b.usageCount,
      NAME_ASC: (a, b) => a.labels.KO.localeCompare(b.labels.KO),
      NAME_DESC: (a, b) => b.labels.KO.localeCompare(a.labels.KO),
    };
    rows.sort(compare[sort ?? "CREATED_DESC"] ?? compare.CREATED_DESC);

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({ hashtags: rows.map(toItemResponse) });
  }),

  http.get(`${LIVE_BASE_URI}/admin/hashtags/:hashtagId`, async ({ params }) => {
    const hashtag = findHashtag(String(params.hashtagId));

    await delay(MOCK_DELAY_MS);

    if (!hashtag) return notFound();

    return HttpResponse.json(toDetailResponse(hashtag));
  }),

  http.post(`${LIVE_BASE_URI}/admin/hashtags`, async ({ request }) => {
    const body = (await request.json()) as HashtagRequestBody;

    /* 같은 이름을 두 번 등록하면 앱에서 같은 태그가 두 개로 보인다. */
    if (hashtags.some((row) => row.labels.KO === body.ko.trim())) {
      return HttpResponse.json(
        {
          code: "HASHTAG_INVALID",
          message: "이미 등록된 해시태그 이름입니다.",
        },
        { status: 400 },
      );
    }

    const created: MockHashtag = {
      hashtagId: nextId(hashtags, "hashtagId"),
      labels: {
        KO: body.ko.trim(),
        EN: body.en.trim(),
        JA: body.ja.trim(),
        ZH: body.zh.trim(),
        TH: body.th.trim(),
        VI: body.vi.trim(),
      },
      category: body.category,
      isAdult: body.isAdult,
      isActive: body.isEnabled,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    hashtags.unshift(created);

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({ id: String(created.hashtagId) }, { status: 201 });
  }),

  http.patch(
    `${LIVE_BASE_URI}/admin/hashtags/:hashtagId`,
    async ({ params, request }) => {
      const hashtag = findHashtag(String(params.hashtagId));
      const body = (await request.json()) as Partial<HashtagRequestBody>;

      await delay(MOCK_DELAY_MS);

      if (!hashtag) return notFound();

      /* 부분 갱신이다. 보내지 않은 필드는 그대로 둔다(노출 토글이 이 경로를 쓴다). */
      if (body.category !== undefined) hashtag.category = body.category;
      if (body.isAdult !== undefined) hashtag.isAdult = body.isAdult;
      if (body.isEnabled !== undefined) hashtag.isActive = body.isEnabled;

      const languages: [HashtagLanguage, string | undefined][] = [
        ["KO", body.ko],
        ["EN", body.en],
        ["JA", body.ja],
        ["ZH", body.zh],
        ["TH", body.th],
        ["VI", body.vi],
      ];
      for (const [language, value] of languages) {
        if (value !== undefined) hashtag.labels[language] = value.trim();
      }

      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.delete(
    `${LIVE_BASE_URI}/admin/hashtags/:hashtagId`,
    async ({ params }) => {
      const index = hashtags.findIndex(
        (row) => String(row.hashtagId) === String(params.hashtagId),
      );

      await delay(MOCK_DELAY_MS);

      if (index === -1) return notFound();

      /* 사용 중인 태그를 지우면 기존 세계관의 태그가 깨진다. 서버와 같게 막는다. */
      if (hashtags[index].usageCount > 0) {
        return HttpResponse.json(
          {
            code: "HASHTAG_IN_USE",
            message:
              "사용 중인 해시태그는 삭제할 수 없습니다. 노출을 끄는 방식으로 관리해 주세요.",
          },
          { status: 409 },
        );
      }

      hashtags.splice(index, 1);

      return new HttpResponse(null, { status: 204 });
    },
  ),
];
