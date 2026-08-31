import { HttpResponse, delay, http } from "msw";
import type { GlobalSearchItem } from "@/api/search/getGlobalSearch";
import { characters, universes } from "../db/character";
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
        matchesKeyword(
          keyword,
          user.nickname,
          user.email ?? "",
          String(user.userId),
        ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((user) => ({
        type: "USER",
        id: user.userId,
        title: user.nickname,
        description: user.email ?? "",
        href: `/users/${user.userId}`,
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
        id: String(character.characterId),
        title: character.name,
        description: `크리에이터 ${character.creatorNickname}`,
        href: `/universes/characters/${character.characterId}`,
      }));

    const universeItems: GlobalSearchItem[] = universes
      .filter((universe) =>
        matchesKeyword(
          keyword,
          universe.name,
          ...universe.characters.map((character) => character.name),
          String(universe.universeId),
        ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((universe) => ({
        type: "UNIVERSE",
        id: String(universe.universeId),
        title: universe.name,
        description: `캐릭터 ${universe.characters.map((character) => character.name).join(", ")}`,
        href: `/universes/${universe.universeId}`,
      }));

    const hashtagItems: GlobalSearchItem[] = hashtags
      .filter((hashtag) =>
        matchesKeyword(keyword, ...Object.values(hashtag.labels)),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((hashtag) => ({
        type: "HASHTAG",
        id: String(hashtag.hashtagId),
        title: `#${hashtag.labels.KO}`,
        description: `${hashtag.usageCount}곳에서 사용 중`,
        href: `/universes/hashtags?keyword=${encodeURIComponent(hashtag.labels.KO)}`,
      }));

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json({
      items: [
        ...userItems,
        ...characterItems,
        ...universeItems,
        ...hashtagItems,
      ],
    });
  }),
];
