import type { Universe } from "./character";
import {
  resolveLocalizedText,
  type LocalizedText,
  type ServiceLanguage,
} from "./language";

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
  /**
   * 여기서 저장한 목록이 앱에서 나가는 자리.
   *
   * 운영 데이터의 원본은 어드민이고, 메인 서버가 이 목록을 가져가 홈에 뿌린다.
   * "저장하면 앱 어디가 바뀌나"를 화면에서 바로 알 수 있어야 해서 함께 둔다.
   */
  serverSection: {
    /** 앱이 부르는 엔드포인트 */
    path: string;
    /** 그 섹션이 화면에서 하는 일 */
    rule: string;
  };
}

/** 큐레이션 슬롯에 담긴 세계관 1건 */
export interface CurationItem {
  universeId: number;
  order: number;
  universe: Universe;
}

export interface CurationSlot {
  slotKey: CurationSlotKey;
  items: CurationItem[];
  updatedAt: string;
  updatedBy: string;
}

/** 큐레이션 저장 요청 */
export interface UpdateCurationRequest {
  universeIds: number[];
}

/** 메인 배너 */
export interface Banner {
  bannerId: number;
  imageUrl: string;
  universeId: number;
  /** 세계관 원본값. 조회 시 서버가 채워준다. */
  universe: Universe;
  /**
   * 운영 문구 조정을 위한 오버라이드. **언어별로 관리한다.**
   * 비어 있는 언어는 한국어로, 한국어까지 비어 있으면 세계관 원본값을 쓴다.
   */
  titleOverrides?: Partial<LocalizedText>;
  descriptionOverrides?: Partial<LocalizedText>;
  /**
   * 배너에 표시할 해시태그.
   *
   * **자유 입력이 아니라 등록된 해시태그에서 고른다.** 문자열로 적게 두면
   * 앱에 없는 태그가 배너에만 뜨고, 태그 이름을 바꿔도 배너는 옛 이름을 들고 있다.
   * 비어 있으면 세계관 태그를 그대로 쓴다.
   */
  hashtagIds?: number[];
  isActive: boolean;
  order: number;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

export interface BannerFormValues {
  imageUrl: string;
  universeId: number;
  titleOverrides?: Partial<LocalizedText>;
  descriptionOverrides?: Partial<LocalizedText>;
  hashtagIds?: number[];
  isActive: boolean;
  startAt?: string;
  endAt?: string;
}

/**
 * 배너에 실제로 노출될 문구를 계산한다.
 *
 * 우선순위는 **해당 언어 오버라이드 → 한국어 오버라이드 → 세계관 원본**이다.
 * 앱이 언어별로 배너를 받아가므로 화면 미리보기도 같은 규칙을 써야 한다.
 */
export const resolveBannerContent = (
  banner: Banner,
  language: ServiceLanguage = "KO",
  /** 해시태그 ID → 해당 언어 라벨. 목록을 못 받았으면 세계관 태그로 떨어진다. */
  hashtagLabels?: Map<number, string>,
) => {
  const overriddenTags = (banner.hashtagIds ?? [])
    .map((hashtagId) => hashtagLabels?.get(hashtagId))
    .filter((label): label is string => Boolean(label));

  return {
    title:
      resolveLocalizedText(banner.titleOverrides, language) ||
      banner.universe.name,
    description:
      resolveLocalizedText(banner.descriptionOverrides, language) ||
      banner.universe.description,
    tags: overriddenTags.length > 0 ? overriddenTags : banner.universe.tags,
  };
};
