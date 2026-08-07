import { HttpResponse, delay, http } from "msw";
import { scenarios } from "../db/character";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const scenarioHandlers = [
  http.get(`${BASE_URI}/admin/scenarios`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const officialOnly = url.searchParams.get("officialOnly") === "true";
    const sort = url.searchParams.get("sort") ?? "RECENT";

    let filtered = scenarios.filter((scenario) =>
      matchesKeyword(
        keyword,
        scenario.name,
        scenario.characterName,
        String(scenario.scenarioId),
        ...scenario.tags,
      ),
    );

    if (officialOnly) {
      filtered = filtered.filter((scenario) => scenario.isOfficial);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "ASSET_COUNT") return b.assetCount - a.assetCount;
      if (sort === "CHAT_COUNT") return b.chatCount - a.chatCount;

      return b.createdAt.localeCompare(a.createdAt);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${BASE_URI}/admin/scenarios/:scenarioId`, async ({ params }) => {
    const scenarioId = Number(params.scenarioId);
    const scenario = scenarios.find((item) => item.scenarioId === scenarioId);

    await delay(MOCK_DELAY_MS);

    if (!scenario) {
      return HttpResponse.json(
        { code: "SCENARIO_NOT_FOUND", message: "존재하지 않는 세계관입니다." },
        { status: 404 },
      );
    }

    return HttpResponse.json(scenario);
  }),
];
