import type { OfficialAccount } from "@/type/official";
import { daysAgo } from "../utils";
import { characters, universes } from "./character";
import { officialCreatorUsers, users } from "./user";

/**
 * 공식으로 지정된 유저 ID 목록. 서버 설정 `universe.official-user-ids`에 해당한다.
 *
 * 지정 결과를 캐릭터·세계관에 복사해 두지 않고 **여기서 파생시킨다.**
 * 복사해 두면 계정을 해제해도 이미 공식으로 저장된 콘텐츠가 남아, 실제 서버와
 * 다르게 동작한다(서버는 조회할 때마다 이 목록으로 다시 판정한다).
 */
const officialUserIds = new Set<number>(
  /*
    콘텐츠를 가진 운영 계정 두 곳만 지정해 둔다. 지정한 계정에 세계관이 없으면
    공식 목록이 빈 채로 보여, 화면이 잘못된 것인지 지정이 잘못된 것인지 구분이 안 된다.
    (해제 동작을 확인할 대상은 둘이면 충분하다.)
  */
  officialCreatorUsers
    .filter((user) =>
      characters.some((character) => character.creatorId === user.userId),
    )
    .slice(0, 2)
    .map((user) => user.userId),
);

interface OfficialRegistration {
  registeredBy: string;
  registeredAt: string;
}

const registrations = new Map<number, OfficialRegistration>(
  [...officialUserIds].map((userId, index) => [
    userId,
    { registeredBy: "운영자", registeredAt: daysAgo(index * 12 + 6, 11) },
  ]),
);

export const isOfficialUserId = (userId: number) =>
  officialUserIds.has(userId);

/**
 * 크리에이터 전환 여부.
 *
 * 서버는 유저 ID를 크리에이터 ID로 바꿔 공식 판정을 하고, 크리에이터가 없으면
 * 경고 로그만 남기고 건너뛴다. **모든 유저가 곧 크리에이터**이므로 유저가
 * 존재하는지만 확인하면 된다.
 */
const findCreatorId = (userId: number): string | undefined => {
  const user = users.find((item) => item.userId === userId);

  // 목업은 크리에이터 ID를 따로 두지 않으므로 유저 ID를 그대로 쓴다.
  return user ? String(userId) : undefined;
};

/**
 * 캐릭터·세계관의 공식 표시를 지금의 지정 목록으로 다시 계산한다.
 * 등록·해제 직후에 부르면 공식 세계관 목록과 공식 맛보기 후보가 함께 바뀐다.
 */
export const syncOfficialFlags = () => {
  characters.forEach((character) => {
    character.isOfficial = officialUserIds.has(character.creatorId);
  });

  universes.forEach((universe) => {
    universe.isOfficial = officialUserIds.has(universe.creatorId);
  });
};

syncOfficialFlags();

/** 목록 응답. 소유 콘텐츠 수는 매번 세어 실제 데이터와 어긋나지 않게 한다. */
export const listOfficialAccounts = (): OfficialAccount[] =>
  [...officialUserIds]
    .map((userId) => {
      const owned = characters.filter(
        (character) => character.creatorId === userId,
      );
      const registration = registrations.get(userId);
      const user = users.find((item) => item.userId === userId);

      return {
        userId: String(userId),
        nickname: user?.nickname ?? `유저 ${userId}`,
        profileImageUrl: `https://picsum.photos/seed/plat-user-${userId}/96/96`,
        creatorId: findCreatorId(userId),
        universeCount: universes.filter(
          (universe) => universe.creatorId === userId,
        ).length,
        characterCount: owned.length,
        registeredBy: registration?.registeredBy ?? "운영자",
        registeredAt: registration?.registeredAt ?? daysAgo(0),
      };
    })
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

export const addOfficialAccount = (userId: number, registeredBy: string) => {
  officialUserIds.add(userId);
  registrations.set(userId, {
    registeredBy,
    registeredAt: new Date().toISOString(),
  });

  syncOfficialFlags();
};

export const removeOfficialAccount = (userId: number) => {
  officialUserIds.delete(userId);
  registrations.delete(userId);

  syncOfficialFlags();
};
