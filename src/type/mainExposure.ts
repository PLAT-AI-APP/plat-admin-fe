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
