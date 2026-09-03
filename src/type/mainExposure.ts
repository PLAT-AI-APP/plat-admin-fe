import type { ServiceLanguage } from "./language";

/**
 * 메인 화면 섹션.
 *
 * **값은 서버 `HomeSection` enum과 같아야 한다.** 세 섹션 모두 "메인 화면에
 * 노출할 세계관"을 고르는 곳이며, 최대 개수와 후보 필터만 다르다.
 */
export type HomeSectionKey =
  | "TODAY_PICK"
  | "OFFICIAL_PREVIEW"
  | "ASSET_PREVIEW";

/**
 * 섹션에 편성하는 대상 종류.
 *
 * 지금 어드민이 편성하는 것은 세계관뿐이지만, 서버는 대상을
 * `target_type` + `target_id`로 가리켜 캐릭터도 받을 수 있게 두었다.
 */
export type HomeSectionTargetType = "UNIVERSE" | "CHARACTER";

export interface HomeSectionConfig {
  section: HomeSectionKey;
  label: string;
  /** 편성할 수 있는 최대 세계관 수. **언어 하나당 개수다.** */
  maxCount: number;
  /** 후보 목록을 공식 계정의 세계관으로 제한할지 여부 */
  officialOnly: boolean;
  /** 후보 목록 기본 정렬. 서버 `UniverseOrderBy` 값이다. */
  defaultOrder: "CREATED_DESC" | "CHAT_DESC" | "LIKE_DESC";
  /**
   * 여기서 편성한 목록이 앱에서 나가는 자리.
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

/**
 * 편성 목록 한 줄.
 *
 * **세계관 ID가 아니라 편성 행의 ID(`homeSectionId`)가 열쇠다.** 해제 · 순서
 * 저장이 모두 이 값을 쓴다. 같은 세계관이라도 언어가 다르면 다른 행이다.
 */
export interface HomeSectionItem {
  homeSectionId: string;
  targetType: HomeSectionTargetType;
  targetId: string;
  targetName: string;
  profileImageFileId: string | null;
  sortOrder: number;
  /**
   * 맛보기로 실을 회차.
   *
   * **`OFFICIAL_PREVIEW`에서만 쓴다.** 세계관만 고르면 앱이 어느 회차를 실어야
   * 할지 알 수 없어 운영이 직접 지목한다. 아직 고르지 않았으면 null이다.
   */
  scenarioId: string | null;
  /** 회차 제목. 그 언어 번역이 없으면 한국어, 그것도 없으면 "n화"로 온다. */
  scenarioTitle: string | null;
  /**
   * 지금 실제로 앱에 나가는가.
   *
   * 편성돼 있어도 대상이 삭제 · 비공개 · 심사 미통과면 그 자리는 빈다.
   * 서버가 편성 행을 지우지 않는 이유는 되돌아오는 상태이기 때문이다.
   */
  exposed: boolean;
  /** 나가지 않는 이유. `exposed`가 false일 때만 온다. */
  hiddenReason: string | null;
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
 * **배너는 이미지 한 장이 전부다.** 예전에는 세계관을 물고 제목·설명·태그를
 * 앱이 템플릿에 합성했지만, 배너에는 캐릭터 소개뿐 아니라 이벤트·공지처럼
 * 세계관이 없는 것도 들어온다. 템플릿을 걷어내고 완성된 이미지를 그대로
 * 내보낸다 — 무엇을 그릴지는 이미지가 정하고, 어드민은 어디로 보낼지만 정한다.
 *
 * **배너 한 건은 언어 하나에만 속한다.** 이미지에 글자가 박혀 있어서다.
 * 다른 언어에도 같은 자리를 채우려면 그 언어 이미지로 복제한다.
 */
export interface Banner {
  /** Snowflake가 아니지만 다른 ID와 같이 서버가 문자열로 내린다. */
  bannerId: string;
  /** 이 배너가 나갈 언어. 캐러셀 순서도 언어별로 따로 매긴다. */
  language: ServiceLanguage;
  /**
   * 어드민 목록에서 배너를 가리키는 이름.
   *
   * **앱에는 나가지 않는다.** 노출 문구는 전부 이미지 안에 있어서, 이 이름이
   * 없으면 목록도 삭제 확인창도 썸네일 말고는 배너를 지칭할 말이 없다.
   */
  name: string;
  /** 배너 이미지 파일 ID. URL은 `buildImageUrl()`로 만든다. */
  imageFileId: string;
  /**
   * 배너를 눌렀을 때 이동할 곳.
   *
   * 세계관·이벤트·공지 무엇이든 URL 하나로 받는다. 앱 안으로 보낼 때는
   * 딥링크를, 바깥으로 보낼 때는 웹 주소를 적는다.
   * **비어 있으면 이동하지 않는다** — 안내만 하는 배너도 있다.
   */
  linkUrl?: string;
  isActive: boolean;
  /** 언어 안에서의 노출 순서. 1부터 매긴다. */
  sortOrder: number;
  /**
   * 노출 기간. 시각이 아니라 **날짜**다.
   *
   * 운영이 고르는 값이 날짜이고, 앱에서 바뀌는 경계도 서비스 시간대(KST)
   * 기준의 그 날짜다. `YYYY-MM-DD` 형식이며 비어 있으면 그 방향으로 제한이 없다.
   */
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface BannerFormValues {
  language: ServiceLanguage;
  name: string;
  imageFileId: string;
  linkUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}
