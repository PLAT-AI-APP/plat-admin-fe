import { characters, universes } from "./character";
import { officialCreatorUsers } from "./user";

/**
 * 공식으로 지정된 유저 ID 목록. 실서버 `official_accounts` 표에 해당한다.
 *
 * **공식 계정 화면은 실서버로 옮겼다.** 여기 남은 것은 아직 목업으로 도는
 * 캐릭터·세계관·메인 노출이 공식 뱃지를 그릴 씨앗이다. 지정 결과를 캐릭터·세계관에
 * 복사해 두지 않고 **여기서 파생시킨다** — 서버도 조회할 때마다 이 목록으로 다시
 * 판정하므로, 복사해 두면 목업만 실제와 다르게 동작한다.
 */
const officialUserIds = new Set<string>(
  /*
    콘텐츠를 가진 운영 계정 두 곳만 지정해 둔다. 지정한 계정에 세계관이 없으면
    공식 목록이 빈 채로 보여, 화면이 잘못된 것인지 지정이 잘못된 것인지 구분이 안 된다.
  */
  officialCreatorUsers
    .filter((user) =>
      characters.some((character) => character.creatorId === user.userId),
    )
    .slice(0, 2)
    .map((user) => user.userId),
);

/** 캐릭터·세계관의 공식 표시를 지정 목록으로 계산한다. */
export const syncOfficialFlags = () => {
  characters.forEach((character) => {
    character.isOfficial = officialUserIds.has(character.creatorId);
  });

  universes.forEach((universe) => {
    universe.isOfficial = officialUserIds.has(universe.creatorId);
  });
};

syncOfficialFlags();
