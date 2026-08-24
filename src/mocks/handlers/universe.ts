import { HttpResponse, delay, http } from "msw";
import { isExposableUniverse } from "@/type/character";
import { universes } from "../db/character";
import { MOCK_DELAY_MS, matchesKeyword, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/*
 * 세계관 목록만 목업으로 둔다. **상세는 실서버(plat-be plat-admin)로 옮겨** liveAxios가
 * 8081로 직접 부르므로 목업 상세 핸들러가 없다. 이 목록은 아직 목업인 큐레이션 후보
 * 피커·공식 패널(`useUniverseListQuery`)이 쓴다. 보드는 실서버 목록을 따로 쓴다.
 */
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

];
