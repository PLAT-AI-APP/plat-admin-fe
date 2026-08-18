import type { Banner, CurationSlot, CurationSlotKey } from "@/type/mainExposure";
import { daysAgo } from "../utils";
import { universes } from "./character";
/*
  공식 여부는 공식 계정 지정에서 파생된다. 아래 OFFICIAL_TASTE 초기값이 그 값을
  읽으므로, 판정이 끝난 뒤에 이 파일이 평가되도록 여기서 명시적으로 부른다.
  (import 순서에 맡기면 슬롯이 조용히 빈 채로 시작한다.)
*/
import { syncOfficialFlags } from "./official";

syncOfficialFlags();

/**
 * 배너 시드.
 *
 * 첫 배너에만 문구 덮어쓰기와 해시태그 지정을 넣어 둔다.
 * 하나도 없으면 "덮어쓰기를 하면 어떻게 보이는지"를 화면에서 확인할 수 없다.
 */
export const banners: Banner[] = universes.slice(0, 5).map((universe, index) => ({
  bannerId: index + 1,
  imageUrl: `https://picsum.photos/seed/plat-banner-${index + 1}/1720/310`,
  universeId: universe.universeId,
  universe,
  titleOverrides:
    index === 0
      ? { KO: "이번 주 신규 세계관", EN: "New this week", JA: "今週の新着" }
      : undefined,
  descriptionOverrides:
    index === 0
      ? {
          KO: "운영이 직접 고른 이번 주 추천 세계관을 만나 보세요.",
          EN: "Meet this week's staff pick.",
        }
      : undefined,
  hashtagIds: index === 0 ? [1, 2, 3] : undefined,
  isActive: index < 4,
  order: index + 1,
  startAt: undefined,
  endAt: undefined,
  createdAt: daysAgo(index + 1, 10),
}));

/** 큐레이션 슬롯별 초기 선택값 */
const INITIAL_UNIVERSE_IDS: Record<CurationSlotKey, number[]> = {
  TODAY_PICK: universes.slice(0, 6).map((universe) => universe.universeId),
  OFFICIAL_TASTE: universes
    .filter((universe) => universe.isOfficial)
    .slice(0, 2)
    .map((universe) => universe.universeId),
  ASSET_RICH: [...universes]
    .sort((a, b) => b.assetCount - a.assetCount)
    .slice(0, 3)
    .map((universe) => universe.universeId),
};

const buildSlot = (slotKey: CurationSlotKey): CurationSlot => ({
  slotKey,
  items: INITIAL_UNIVERSE_IDS[slotKey].map((universeId, index) => ({
    universeId,
    order: index + 1,
    universe: universes.find((item) => item.universeId === universeId)!,
  })),
  updatedAt: daysAgo(1, 16),
  updatedBy: "운영자",
});

export const curationSlots: Record<CurationSlotKey, CurationSlot> = {
  TODAY_PICK: buildSlot("TODAY_PICK"),
  OFFICIAL_TASTE: buildSlot("OFFICIAL_TASTE"),
  ASSET_RICH: buildSlot("ASSET_RICH"),
};
