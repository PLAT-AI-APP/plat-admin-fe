import type { Universe } from "./character";
import type { ServiceLanguage } from "./language";

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
    /** 앱이 부르는 엔드포인트. 언어(`?lang=`)는 화면이 붙여 그린다. */
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

/**
 * 큐레이션 슬롯 1개 = **슬롯 × 언어** 한 칸.
 *
 * 같은 `TODAY_PICK`이라도 한국어 목록과 영어 목록은 서로 다른 자료다.
 * 앱이 `?lang=EN`으로 가져가는 목록이 곧 이 칸이다.
 */
export interface CurationSlot {
  slotKey: CurationSlotKey;
  language: ServiceLanguage;
  items: CurationItem[];
  updatedAt: string;
  updatedBy: string;
  /** 수정 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  updatedById?: number;
}

/** 큐레이션 저장 요청. 언어는 경로/쿼리로 따로 넘긴다. */
export interface UpdateCurationRequest {
  universeIds: number[];
}

/**
 * 언어별 등록 건수.
 *
 * 탭을 눌러 보기 전에는 **비어 있는 언어를 알 수 없다.** 목록은 한 번에 한
 * 언어만 불러오므로, 어느 언어가 아직 비었는지는 이 요약으로 본다.
 */
export interface LanguageCount {
  language: ServiceLanguage;
  count: number;
}

/**
 * 메인 배너.
 *
 * **배너 한 건은 언어 하나에만 속한다.** 이미지에 글자가 박혀 있는 데다
 * 가리키는 세계관이 그 언어 번역을 갖췄는지도 언어마다 다르다. 한 건을 여러
 * 언어가 나눠 쓰면 "영어 캐러셀 두 번째 자리"를 따로 정할 수 없다.
 * 다른 언어에도 같은 배너를 걸려면 그 언어로 복제한다.
 */
export interface Banner {
  bannerId: number;
  /** 이 배너가 나갈 언어. 캐러셀 순서도 언어별로 따로 매긴다. */
  language: ServiceLanguage;
  imageUrl: string;
  universeId: number;
  /** 세계관 원본값. 조회 시 서버가 채워준다. */
  universe: Universe;
  /**
   * 운영 문구 조정을 위한 오버라이드. 배너의 언어로 쓴 문구다.
   * 비어 있으면 세계관 원본값을 쓴다.
   */
  titleOverride?: string;
  descriptionOverride?: string;
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
  language: ServiceLanguage;
  imageUrl: string;
  universeId: number;
  titleOverride?: string;
  descriptionOverride?: string;
  hashtagIds?: number[];
  isActive: boolean;
  startAt?: string;
  endAt?: string;
}

/**
 * 배너에 실제로 노출될 문구를 계산한다.
 *
 * 우선순위는 **오버라이드 → 세계관 원본**이다. 배너가 이미 언어를 하나 물고
 * 있으므로 여기서 언어를 다시 고르지 않는다.
 */
export const resolveBannerContent = (
  banner: Banner,
  /** 해시태그 ID → 라벨. 목록을 못 받았으면 세계관 태그로 떨어진다. */
  hashtagLabels?: Map<number, string>,
) => {
  const overriddenTags = (banner.hashtagIds ?? [])
    .map((hashtagId) => hashtagLabels?.get(hashtagId))
    .filter((label): label is string => Boolean(label));

  return {
    title: banner.titleOverride?.trim() || banner.universe.name,
    description:
      banner.descriptionOverride?.trim() || banner.universe.description,
    tags: overriddenTags.length > 0 ? overriddenTags : banner.universe.tags,
  };
};
