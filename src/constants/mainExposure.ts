import type { HomeSectionConfig, HomeSectionKey } from "@/type/mainExposure";

/**
 * 메인 섹션 편성 설정.
 *
 * 세 화면(오늘의 PICK / 공식 캐릭터 맛보기 / 에셋 추천)은
 * 동일한 "세계관 편성" 화면이며 아래 설정값만 다르다.
 *
 * **최대 개수는 언어 하나당 개수다.** 목록 자체가 언어별로 따로 있어,
 * 한국어 10개와 영어 10개는 서로 다른 자리를 차지한다.
 *
 * 키는 서버 `HomeSection` enum 값을 그대로 쓴다. 화면 전용 이름을 따로 두면
 * 요청을 만들 때마다 옮겨 적어야 하고, 한쪽만 고치면 조용히 404가 된다.
 */
export const HOME_SECTION_CONFIG: Record<HomeSectionKey, HomeSectionConfig> = {
  TODAY_PICK: {
    section: "TODAY_PICK",
    label: "오늘의 PICK",
    maxCount: 10,
    officialOnly: false,
    defaultOrder: "CREATED_DESC",
    serverSection: {
      path: "GET /home/today-pick",
      rule: "홈 상단에서 편성한 순서대로 카드로 노출됩니다.",
    },
  },
  OFFICIAL_PREVIEW: {
    section: "OFFICIAL_PREVIEW",
    label: "공식 캐릭터 맛보기",
    maxCount: 3,
    officialOnly: true,
    defaultOrder: "CHAT_DESC",
    serverSection: {
      path: "GET /home/official-preview",
      rule: "세계관의 시나리오 맛보기까지 함께 실리는 섹션입니다.",
    },
  },
  ASSET_PREVIEW: {
    section: "ASSET_PREVIEW",
    label: "에셋 추천",
    maxCount: 3,
    officialOnly: false,
    defaultOrder: "LIKE_DESC",
    serverSection: {
      path: "GET /home/asset-preview",
      rule: "에셋 이미지를 크게 보여 주는 큰 카드 섹션입니다.",
    },
  },
};

/** 배너 노출 비율. 앱 메인 최상단 캐러셀과 동일하다. */
export const BANNER_ASPECT_RATIO = "1720 / 310";
