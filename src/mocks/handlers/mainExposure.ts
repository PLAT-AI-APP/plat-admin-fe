import { HttpResponse, delay, http } from "msw";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import type {
  Banner,
  BannerFormValues,
  CurationSlotKey,
  LanguageCount,
  UpdateCurationRequest,
} from "@/type/mainExposure";
import { banners, curationSlots } from "../db/mainExposure";
import { stampAdmin } from "../session";
import { universes } from "../db/character";
import { MOCK_DELAY_MS, nextId } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 세계관 ID로 세계관을 찾는다. 없으면 404 응답용으로 undefined를 반환한다. */
const findUniverse = (universeId: number) =>
  universes.find((universe) => universe.universeId === universeId);

/** 요청 언어. 지정하지 않으면 한국어로 본다(앱 기본 언어). */
const languageOf = (url: URL): ServiceLanguage =>
  (url.searchParams.get("language") as ServiceLanguage | null) ?? "KO";

const bannersOf = (language: ServiceLanguage) =>
  banners
    .filter((banner) => banner.language === language)
    .sort((a, b) => a.order - b.order);

/** 언어 안에서만 순서를 다시 매긴다. 다른 언어의 캐러셀 자리는 건드리지 않는다. */
const renumber = (language: ServiceLanguage) => {
  bannersOf(language).forEach((banner, index) => {
    banner.order = index + 1;
  });
};

export const mainExposureHandlers = [
  // `:bannerId` 패턴보다 먼저 와야 `/languages`가 ID로 해석되지 않는다.
  http.get(`${BASE_URI}/admin/main/banners/languages`, async () => {
    await delay(MOCK_DELAY_MS);

    const counts: LanguageCount[] = SERVICE_LANGUAGES.map((language) => ({
      language,
      count: bannersOf(language).length,
    }));

    return HttpResponse.json(counts);
  }),

  http.get(`${BASE_URI}/admin/main/banners`, async ({ request }) => {
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(bannersOf(languageOf(new URL(request.url))));
  }),

  http.post(`${BASE_URI}/admin/main/banners`, async ({ request }) => {
    const body = (await request.json()) as BannerFormValues;
    const universe = findUniverse(body.universeId);

    if (!universe) {
      return HttpResponse.json(
        { code: "UNIVERSE_NOT_FOUND", message: "존재하지 않는 세계관입니다." },
        { status: 404 },
      );
    }

    const created: Banner = {
      ...body,
      bannerId: nextId(banners, "bannerId"),
      universe,
      // 새 배너는 그 언어 캐러셀의 맨 뒤에 붙는다.
      order: bannersOf(body.language).length + 1,
      createdAt: new Date().toISOString(),
    };

    banners.push(created);
    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(created, { status: 201 });
  }),

  // `:bannerId` 패턴보다 먼저 와야 `/order`가 ID로 해석되지 않는다.
  http.put(`${BASE_URI}/admin/main/banners/order`, async ({ request }) => {
    const language = languageOf(new URL(request.url));
    const { bannerIds } = (await request.json()) as { bannerIds: number[] };

    bannerIds.forEach((bannerId, index) => {
      const banner = banners.find((item) => item.bannerId === bannerId);
      // 다른 언어의 배너가 섞여 오면 무시한다. 언어별 캐러셀은 서로 독립이다.
      if (banner?.language === language) banner.order = index + 1;
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(bannersOf(language));
  }),

  http.put(
    `${BASE_URI}/admin/main/banners/:bannerId`,
    async ({ params, request }) => {
      const bannerId = Number(params.bannerId);
      const body = (await request.json()) as BannerFormValues;
      const index = banners.findIndex((banner) => banner.bannerId === bannerId);
      const universe = findUniverse(body.universeId);

      if (index < 0 || !universe) {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "대상을 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      const previousLanguage = banners[index].language;
      const isLanguageChanged = previousLanguage !== body.language;

      banners[index] = {
        ...banners[index],
        ...body,
        universe,
        // 언어를 옮겼으면 새 언어 캐러셀의 맨 뒤로 간다. 옛 자리 번호는 의미가 없다.
        order: isLanguageChanged
          ? bannersOf(body.language).length + 1
          : banners[index].order,
      };

      if (isLanguageChanged) renumber(previousLanguage);

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(banners[index]);
    },
  ),

  http.delete(`${BASE_URI}/admin/main/banners/:bannerId`, async ({ params }) => {
    const bannerId = Number(params.bannerId);
    const index = banners.findIndex((banner) => banner.bannerId === bannerId);
    const language = banners[index]?.language;

    if (index >= 0) banners.splice(index, 1);

    // 삭제 후 그 언어의 순서를 다시 매긴다.
    if (language) renumber(language);

    await delay(MOCK_DELAY_MS);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(
    `${BASE_URI}/admin/main/curations/:slotKey/languages`,
    async ({ params }) => {
      const slotKey = params.slotKey as CurationSlotKey;
      await delay(MOCK_DELAY_MS);

      const counts: LanguageCount[] = SERVICE_LANGUAGES.map((language) => ({
        language,
        count: curationSlots[slotKey][language].items.length,
      }));

      return HttpResponse.json(counts);
    },
  ),

  http.get(
    `${BASE_URI}/admin/main/curations/:slotKey`,
    async ({ params, request }) => {
      const slotKey = params.slotKey as CurationSlotKey;
      const language = languageOf(new URL(request.url));
      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(curationSlots[slotKey][language]);
    },
  ),

  http.put(
    `${BASE_URI}/admin/main/curations/:slotKey`,
    async ({ params, request }) => {
      const slotKey = params.slotKey as CurationSlotKey;
      const language = languageOf(new URL(request.url));
      const { universeIds } = (await request.json()) as UpdateCurationRequest;
      const editor = stampAdmin();

      curationSlots[slotKey][language] = {
        slotKey,
        language,
        items: universeIds
          .map((universeId, index) => {
            const universe = findUniverse(universeId);

            return universe
              ? { universeId, order: index + 1, universe }
              : undefined;
          })
          .filter((item) => item !== undefined),
        updatedAt: new Date().toISOString(),
        updatedBy: editor.name,
        updatedById: editor.managerId,
      };

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(curationSlots[slotKey][language]);
    },
  ),
];
