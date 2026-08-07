import type { CurationSlotConfig, CurationSlotKey } from "@/type/mainExposure";

/**
 * 큐레이션 슬롯 설정.
 *
 * 세 화면(오늘의 PICK / 공식 캐릭터 맛보기 / 에셋 추천)은
 * 동일한 "세계관 선택" 화면이며 아래 설정값만 다르다.
 */
export const CURATION_SLOT_CONFIG: Record<CurationSlotKey, CurationSlotConfig> =
  {
    TODAY_PICK: {
      slotKey: "TODAY_PICK",
      label: "오늘의 PICK",
      maxCount: 10,
      officialOnly: false,
      defaultSort: "RECENT",
    },
    OFFICIAL_TASTE: {
      slotKey: "OFFICIAL_TASTE",
      label: "공식 캐릭터 맛보기",
      maxCount: 3,
      officialOnly: true,
      defaultSort: "CHAT_COUNT",
    },
    ASSET_RICH: {
      slotKey: "ASSET_RICH",
      label: "에셋 추천",
      maxCount: 3,
      officialOnly: false,
      defaultSort: "ASSET_COUNT",
    },
  };

/** 배너 노출 비율. 앱 메인 최상단 캐러셀과 동일하다. */
export const BANNER_ASPECT_RATIO = "1720 / 310";
