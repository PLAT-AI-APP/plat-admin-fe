import { supportsLanguage } from "@/type/character";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import type { Banner, CurationSlot, CurationSlotKey } from "@/type/mainExposure";
import { daysAgo } from "../utils";
import { universes } from "./character";
import { managers } from "./ops";
/*
  공식 여부는 공식 계정 지정에서 파생된다. 아래 OFFICIAL_TASTE 초기값이 그 값을
  읽으므로, 판정이 끝난 뒤에 이 파일이 평가되도록 여기서 명시적으로 부른다.
  (import 순서에 맡기면 슬롯이 조용히 빈 채로 시작한다.)
*/
import { syncOfficialFlags } from "./official";

syncOfficialFlags();

/**
 * 언어별 배너 시드 수.
 *
 * **일부러 언어마다 다르게 두고, 중국어·태국어·베트남어는 비워 둔다.**
 * 모든 언어를 똑같이 채우면 "배너를 언어별로 관리한다"는 사실이 화면에서
 * 드러나지 않고, 아직 아무것도 등록되지 않은 언어의 빈 화면도 확인할 수 없다.
 */
const BANNER_SEED_COUNT: Partial<Record<ServiceLanguage, number>> = {
  KO: 5,
  EN: 3,
  JA: 2,
};

/** 첫 배너에만 넣는 문구 덮어쓰기. 덮어쓰기가 어떻게 보이는지 화면에서 확인하는 용도다. */
const BANNER_OVERRIDE: Partial<
  Record<ServiceLanguage, { title: string; description: string }>
> = {
  KO: {
    title: "이번 주 신규 세계관",
    description: "운영이 직접 고른 이번 주 추천 세계관을 만나 보세요.",
  },
  EN: {
    title: "New this week",
    description: "Meet this week's staff pick.",
  },
  JA: {
    title: "今週の新着",
    description: "運営が選んだ今週のおすすめ世界観です。",
  },
};

/**
 * 배너 시드.
 *
 * 배너는 언어 하나에만 속하므로 언어별로 따로 만든다. 순서(`order`)도
 * 언어 안에서만 매긴다 — 한국어 3번 배너와 영어 3번 배너는 서로 다른 자리다.
 *
 * 노출 불가 상태인 세계관도 일부러 섞인다. "세계관이 내려간 배너가 노출 중"
 * 경고를 화면에서 확인할 수 있어야 하기 때문이다.
 */
export const banners: Banner[] = SERVICE_LANGUAGES.flatMap((language) => {
  const override = BANNER_OVERRIDE[language];

  return universes
    .filter((universe) => supportsLanguage(universe, language))
    .slice(0, BANNER_SEED_COUNT[language] ?? 0)
    .map((universe, index) => ({
      bannerId: 0, // 아래에서 언어를 가로질러 한 번에 매긴다.
      language,
      imageUrl: `https://picsum.photos/seed/plat-banner-${language}-${index + 1}/1720/310`,
      universeId: universe.universeId,
      universe,
      titleOverride: index === 0 ? override?.title : undefined,
      descriptionOverride: index === 0 ? override?.description : undefined,
      hashtagIds: index === 0 ? [1, 2, 3] : undefined,
      isActive: index < 4,
      order: index + 1,
      startAt: undefined,
      endAt: undefined,
      createdAt: daysAgo(index + 1, 10),
    }));
});

/* 배너 ID는 언어와 무관하게 하나의 번호 체계를 쓴다. 수정·삭제가 ID 하나로 끝난다. */
banners.forEach((banner, index) => {
  banner.bannerId = index + 1;
});

/**
 * 큐레이션을 시드해 둘 언어.
 *
 * 배너와 같은 이유로 전부 채우지 않는다. 아직 아무도 고르지 않은 언어의
 * 목록이 어떻게 보이는지도 화면에서 확인되어야 한다.
 */
const SEEDED_LANGUAGES: ServiceLanguage[] = ["KO", "EN", "JA"];

/**
 * 슬롯 × 언어별 초기 선택값.
 *
 * 후보 자체가 언어마다 다르므로(그 언어 번역이 있는 세계관만) 목록도 저절로
 * 달라진다. 같은 세계관을 억지로 맞춰 넣지 않는다.
 */
const initialUniverseIds = (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
): number[] => {
  if (!SEEDED_LANGUAGES.includes(language)) return [];

  const candidates = universes.filter((universe) =>
    supportsLanguage(universe, language),
  );

  if (slotKey === "TODAY_PICK") {
    return candidates.slice(0, 6).map((universe) => universe.universeId);
  }

  if (slotKey === "OFFICIAL_TASTE") {
    return candidates
      .filter((universe) => universe.isOfficial)
      .slice(0, 2)
      .map((universe) => universe.universeId);
  }

  return [...candidates]
    .sort((a, b) => b.assetCount - a.assetCount)
    .slice(0, 3)
    .map((universe) => universe.universeId);
};

const buildSlot = (
  slotKey: CurationSlotKey,
  language: ServiceLanguage,
): CurationSlot => ({
  slotKey,
  language,
  items: initialUniverseIds(slotKey, language).map((universeId, index) => ({
    universeId,
    order: index + 1,
    universe: universes.find((item) => item.universeId === universeId)!,
  })),
  updatedAt: daysAgo(1, 16),
  updatedBy: managers[0].name,
  updatedById: managers[0].managerId,
});

const buildSlotByLanguage = (slotKey: CurationSlotKey) =>
  Object.fromEntries(
    SERVICE_LANGUAGES.map((language) => [language, buildSlot(slotKey, language)]),
  ) as Record<ServiceLanguage, CurationSlot>;

/** 슬롯 × 언어 2단 맵. 앱이 `?lang=`으로 가져가는 단위가 안쪽 칸 하나다. */
export const curationSlots: Record<
  CurationSlotKey,
  Record<ServiceLanguage, CurationSlot>
> = {
  TODAY_PICK: buildSlotByLanguage("TODAY_PICK"),
  OFFICIAL_TASTE: buildSlotByLanguage("OFFICIAL_TASTE"),
  ASSET_RICH: buildSlotByLanguage("ASSET_RICH"),
};
