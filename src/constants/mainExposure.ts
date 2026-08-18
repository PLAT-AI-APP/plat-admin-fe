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
      serverSection: {
        path: "GET /home/today-pick",
        rule: "홈 상단에서 고른 순서대로 카드로 노출됩니다.",
      },
    },
    OFFICIAL_TASTE: {
      slotKey: "OFFICIAL_TASTE",
      label: "공식 캐릭터 맛보기",
      maxCount: 3,
      officialOnly: true,
      defaultSort: "CHAT_COUNT",
      serverSection: {
        path: "GET /home/official-preview",
        rule: "세계관의 에피소드 맛보기까지 함께 실리는 섹션입니다.",
      },
    },
    ASSET_RICH: {
      slotKey: "ASSET_RICH",
      label: "에셋 추천",
      maxCount: 3,
      officialOnly: false,
      defaultSort: "ASSET_COUNT",
      serverSection: {
        path: "GET /home/asset-preview",
        rule: "에셋 이미지를 크게 보여 주는 큰 카드 섹션입니다.",
      },
    },
  };

/** 배너 노출 비율. 앱 메인 최상단 캐러셀과 동일하다. */
export const BANNER_ASPECT_RATIO = "1720 / 310";
