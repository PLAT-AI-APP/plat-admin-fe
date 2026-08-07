import { HttpResponse, delay, http } from "msw";
import type { GlobalSearchItem } from "@/api/search/getGlobalSearch";
import { characters, scenarios } from "../db/character";
import { hashtags } from "../db/hashtag";
import { users } from "../db/user";
import { MOCK_DELAY_MS, matchesKeyword } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 종류별 최대 노출 수. 한 종류가 결과를 독점하지 않게 한다. */
const LIMIT_PER_TYPE = 5;

export const searchHandlers = [
  http.get(`${BASE_URI}/admin/search`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";

    if (keyword.trim().length < 2) {
      return HttpResponse.json({ items: [] });
    }

    const userItems: GlobalSearchItem[] = users
      .filter((user) =>
        matchesKeyword(keyword, user.nickname, user.email, String(user.userId)),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((user) => ({
        type: "USER",
        id: user.userId,
        title: user.nickname,
        description: user.email,
        href: `/users?keyword=${encodeURIComponent(user.nickname)}`,
      }));

    const characterItems: GlobalSearchItem[] = characters
      .filter((character) =>
        matchesKeyword(
          keyword,
          character.name,
          character.creatorNickname,
          String(character.characterId),
        ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((character) => ({
        type: "CHARACTER",
        id: character.characterId,
        title: character.name,
        description: `크리에이터 ${character.creatorNickname}`,
        href: `/characters?keyword=${encodeURIComponent(character.name)}`,
      }));

    const scenarioItems: GlobalSearchItem[] = scenarios
      .filter((scenario) =>
        matchesKeyword(
          keyword,
          scenario.name,
          scenario.characterName,
          String(scenario.scenarioId),
        ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((scenario) => ({
        type: "SCENARIO",
        id: scenario.scenarioId,
        title: scenario.name,
        description: `캐릭터 ${scenario.characterName}`,
        href: `/characters/scenarios?keyword=${encodeURIComponent(scenario.name)}`,
      }));

    const hashtagItems: GlobalSearchItem[] = hashtags
      .filter((hashtag) =>
        matchesKeyword(keyword, ...Object.values(hashtag.labels)),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((hashtag) => ({
        type: "HASHTAG",
        id: hashtag.hashtagId,
        title: `#${hashtag.labels.KO}`,
        description: `${hashtag.usageCount}곳에서 사용 중`,
        href: `/characters/hashtags?keyword=${encodeURIComponent(hashtag.labels.KO)}`,
      }));

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      items: [
        ...userItems,
        ...characterItems,
        ...scenarioItems,
        ...hashtagItems,
      ],
    });
  }),
];
