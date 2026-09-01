import { supportsLanguage } from "@/type/character";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import type { CurationSlot, CurationSlotKey } from "@/type/mainExposure";
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
