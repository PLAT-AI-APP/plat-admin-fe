import type { Banner, CurationSlot, CurationSlotKey } from "@/type/mainExposure";
import { daysAgo } from "../utils";
import { scenarios } from "./character";

export const banners: Banner[] = scenarios.slice(0, 5).map((scenario, index) => ({
  bannerId: index + 1,
  imageUrl: `https://picsum.photos/seed/plat-banner-${index + 1}/1720/310`,
  scenarioId: scenario.scenarioId,
  scenario,
  titleOverride: undefined,
  descriptionOverride: undefined,
  tagsOverride: undefined,
  isActive: index < 4,
  order: index + 1,
  startAt: undefined,
  endAt: undefined,
  createdAt: daysAgo(index + 1, 10),
}));

/** 큐레이션 슬롯별 초기 선택값 */
const INITIAL_SCENARIO_IDS: Record<CurationSlotKey, number[]> = {
  TODAY_PICK: scenarios.slice(0, 6).map((scenario) => scenario.scenarioId),
  OFFICIAL_TASTE: scenarios
    .filter((scenario) => scenario.isOfficial)
    .slice(0, 2)
    .map((scenario) => scenario.scenarioId),
  ASSET_RICH: [...scenarios]
    .sort((a, b) => b.assetCount - a.assetCount)
    .slice(0, 3)
    .map((scenario) => scenario.scenarioId),
};

const buildSlot = (slotKey: CurationSlotKey): CurationSlot => ({
  slotKey,
  items: INITIAL_SCENARIO_IDS[slotKey].map((scenarioId, index) => ({
    scenarioId,
    order: index + 1,
    scenario: scenarios.find((item) => item.scenarioId === scenarioId)!,
  })),
  updatedAt: daysAgo(1, 16),
  updatedBy: "운영자",
});

export const curationSlots: Record<CurationSlotKey, CurationSlot> = {
  TODAY_PICK: buildSlot("TODAY_PICK"),
  OFFICIAL_TASTE: buildSlot("OFFICIAL_TASTE"),
  ASSET_RICH: buildSlot("ASSET_RICH"),
};
