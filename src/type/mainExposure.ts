import type { Scenario } from "./character";

/**
 * 큐레이션 슬롯 종류.
 * 세 슬롯 모두 "메인 화면에 노출할 세계관"을 고르는 곳이며,
 * 최대 개수와 후보 필터만 다르다.
 */
export type CurationSlotKey = "TODAY_PICK" | "OFFICIAL_TASTE" | "ASSET_RICH";

export interface CurationSlotConfig {
  slotKey: CurationSlotKey;
  label: string;
  /** 선택 가능한 최대 세계관 수 */
  maxCount: number;
  /** 후보 목록을 공식 세계관으로 제한할지 여부 */
  officialOnly: boolean;
  /** 후보 목록 기본 정렬 */
  defaultSort: "RECENT" | "ASSET_COUNT" | "CHAT_COUNT";
}

/** 큐레이션 슬롯에 담긴 세계관 1건 */
export interface CurationItem {
  scenarioId: number;
  order: number;
  scenario: Scenario;
}

export interface CurationSlot {
  slotKey: CurationSlotKey;
  items: CurationItem[];
  updatedAt: string;
  updatedBy: string;
}

/** 큐레이션 저장 요청 */
export interface UpdateCurationRequest {
  scenarioIds: number[];
}

/** 메인 배너 */
export interface Banner {
  bannerId: number;
  imageUrl: string;
  scenarioId: number;
  /** 세계관 원본값. 조회 시 서버가 채워준다. */
  scenario: Scenario;
  /** 운영 문구 조정을 위한 오버라이드. 비어 있으면 세계관 원본값을 쓴다. */
  titleOverride?: string;
  descriptionOverride?: string;
  tagsOverride?: string[];
  isActive: boolean;
  order: number;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

export interface BannerFormValues {
  imageUrl: string;
  scenarioId: number;
  titleOverride?: string;
  descriptionOverride?: string;
  tagsOverride?: string[];
  isActive: boolean;
  startAt?: string;
  endAt?: string;
}

/** 배너에 실제로 노출될 문구를 계산한다. 오버라이드가 우선한다. */
export const resolveBannerContent = (banner: Banner) => ({
  title: banner.titleOverride || banner.scenario.name,
  description: banner.descriptionOverride || banner.scenario.description,
  tags:
    banner.tagsOverride && banner.tagsOverride.length > 0
      ? banner.tagsOverride
      : banner.scenario.tags,
});
