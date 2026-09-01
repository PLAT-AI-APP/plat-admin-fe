import { HttpResponse, delay, http } from "msw";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import type {
  CurationSlotKey,
  LanguageCount,
  UpdateCurationRequest,
} from "@/type/mainExposure";
import { curationSlots } from "../db/mainExposure";
import { stampAdmin } from "../session";
import { universes } from "../db/character";
import { MOCK_DELAY_MS } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 세계관 ID로 세계관을 찾는다. 없으면 404 응답용으로 undefined를 반환한다. */
const findUniverse = (universeId: number) =>
  universes.find((universe) => universe.universeId === universeId);

/** 요청 언어. 지정하지 않으면 한국어로 본다(앱 기본 언어). */
const languageOf = (url: URL): ServiceLanguage =>
  (url.searchParams.get("language") as ServiceLanguage | null) ?? "KO";

export const mainExposureHandlers = [
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
