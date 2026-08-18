import { HttpResponse, delay, http } from "msw";
import { isExposableUniverse } from "@/type/character";
import { universeScenarios, universes } from "../db/character";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const universeHandlers = [
  http.get(`${BASE_URI}/admin/universes`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const officialOnly = url.searchParams.get("officialOnly") === "true";
    const exposableOnly = url.searchParams.get("exposableOnly") === "true";
    const status = url.searchParams.get("status") ?? "";
    const reviewStatus = url.searchParams.get("reviewStatus") ?? "";
    const sort = url.searchParams.get("sort") ?? "RECENT";

    let filtered = universes.filter((universe) =>
      matchesKeyword(
        keyword,
        universe.name,
        ...universe.characters.map((character) => character.name),
        universe.creatorNickname,
        String(universe.universeId),
        ...universe.tags,
      ),
    );

    if (officialOnly) {
      filtered = filtered.filter((universe) => universe.isOfficial);
    }

    if (exposableOnly) {
      filtered = filtered.filter(isExposableUniverse);
    }

    if (status) {
      filtered = filtered.filter((universe) => universe.status === status);
    } else {
      /*
        상태를 고르지 않았을 때 삭제·파기를 함께 보여 주면, 이미 앱에서 사라진
        세계관이 큐레이션 후보 목록에 섞인다. 골라 봐야만 나오게 둔다.
      */
      filtered = filtered.filter(
        (universe) =>
          universe.status !== "DELETED" && universe.status !== "PURGED",
      );
    }

    if (reviewStatus) {
      filtered = filtered.filter(
        (universe) => universe.reviewStatus === reviewStatus,
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "ASSET_COUNT") return b.assetCount - a.assetCount;
      if (sort === "CHAT_COUNT") return b.chatCount - a.chatCount;

      return b.createdAt.localeCompare(a.createdAt);
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${BASE_URI}/admin/universes/:universeId`, async ({ params }) => {
    const universeId = Number(params.universeId);
    const universe = universes.find((item) => item.universeId === universeId);

    await delay(MOCK_DELAY_MS);

    if (!universe) {
      return HttpResponse.json(
        { code: "UNIVERSE_NOT_FOUND", message: "존재하지 않는 세계관입니다." },
        { status: 404 },
      );
    }

    /* 상세에만 시나리오를 싣는다. 구버전은 회차 순서를 흐트러뜨리므로 뒤로 보낸다. */
    const scenarios = universeScenarios
      .filter((scenario) => scenario.universeId === universeId)
      .sort((a, b) => a.episodeNo - b.episodeNo);

    return HttpResponse.json({ ...universe, scenarios });
  }),
];
