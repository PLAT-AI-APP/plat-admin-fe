import type { HashtagCategory } from "./hashtag";
import {
  SERVICE_LANGUAGE_LABEL,
  type ServiceLanguage,
} from "./language";

/** 캐릭터 노출 상태 */
export type CharacterVisibility = "PUBLIC" | "PRIVATE" | "HIDDEN";

/** 캐릭터 운영 상태 */
export type CharacterStatus = "ACTIVE" | "BLOCKED" | "DELETED";

export interface Character {
  characterId: number;
  name: string;
  thumbnailUrl: string;
  creatorId: number;
  creatorNickname: string;
  /**
   * 공식 여부. 소유 크리에이터가 공식 계정으로 등록되어 있으면 참이다.
   * 캐릭터마다 켜고 끄는 값이 아니다. `Universe.isOfficial`과 같은 규칙이다.
   */
  isOfficial: boolean;
  visibility: CharacterVisibility;
  status: CharacterStatus;
  isNsfw: boolean;
  tags: string[];
  /** 이 캐릭터가 등장하는 세계관 수. 한 캐릭터가 여러 세계관에 나올 수 있다. */
  universeCount: number;
  assetCount: number;
  chatCount: number;
  likeCount: number;
  createdAt: string;
}

export interface CharacterDetail extends Character {
  description: string;
  greeting: string;
  personality: string;
  /** 이 캐릭터가 등장하는 세계관 목록 */
  universes: Universe[];
  updatedAt: string;
}

/**
 * 세계관 공개 범위. 서버 `UniverseVisibility`와 같다.
 * `UNLISTED`는 링크를 아는 사람만 보는 일부공개다.
 */
export type UniverseVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

/**
 * 세계관 운영 상태. 서버 `UniverseStatus`와 같다.
 *
 * 삭제는 두 단계다. `DELETED`는 유저가 지운 뒤 파기를 기다리는 상태이고,
 * `PURGED`는 정리 스케줄이 실제 콘텐츠(이미지·에셋)를 파기한 상태다.
 * 파기 전까지는 복구 문의를 받을 수 있으므로 운영에서 두 상태를 구분해야 한다.
 */
export type UniverseStatus = "ACTIVE" | "INACTIVE" | "DELETED" | "PURGED";

/** 세계관 심사 상태. 서버 `ReviewStatus`와 같다. 승인 전에는 앱에 노출되지 않는다. */
export type UniverseReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/** 세계관 장르. 서버 `UniverseCategory`와 같다. */
export type UniverseCategory =
  | "ROMANCE"
  | "FANTASY"
  | "DRAMA"
  | "MARTIAL_ARTS"
  | "GL"
  | "BL"
  | "HORROR"
  | "MYSTERY";

/** 세계관 성향. 서버 `UniverseTendency`와 같다. */
export type UniverseTendency = "ALL" | "MALE_ORIENTED" | "FEMALE_ORIENTED";

/**
 * 시나리오 종류. 서버 `ScenarioType`과 같다.
 *
 * 세계관 하나에 시나리오가 여러 편 있고, 유저는 그중 하나를 골라 대화를 시작한다.
 * `START`는 세계관에 처음 들어왔을 때의 시작 시나리오다.
 */
export type ScenarioType = "START" | "NORMAL" | "EVENT" | "ENDING";

/**
 * 시나리오 상태. 서버 `ScenarioStatus`와 같다.
 *
 * `DEPRECATED`는 지운 것이 아니라 **구버전**이다. 이미 그 시나리오로 대화를
 * 시작한 방이 남아 있어 지울 수 없다.
 */
export type ScenarioLifecycle = "ACTIVE" | "HIDDEN" | "DEPRECATED";

/**
 * 시나리오(에피소드) — **목업 큐레이션 구간에서만 쓰는 모양**이다.
 *
 * 세계관이 "무대"라면 시나리오는 **그 무대에서 시작하는 한 편의 이야기**다.
 * 유저는 세계관에 들어가 시나리오를 고르고, 그 시나리오의 상황과 첫 대사로
 * 대화를 시작한다. (plat-fe의 캐릭터 상세 > 시나리오 선택)
 *
 * 실서버 상세는 상황·첫 대사를 따로 주지 않고 **언어별 본문(`content`)** 하나로 준다.
 * 실연동된 상세 화면은 아래 `UniverseScenarioDetail`을 쓴다.
 */
export interface UniverseScenario {
  scenarioId: number;
  universeId: number;
  /** 회차. 목록 정렬 기준이자 유저에게 보이는 번호다. */
  episodeNo: number;
  type: ScenarioType;
  status: ScenarioLifecycle;
  /** 버전. 내용을 고치면 올라가고, 옛 버전은 `DEPRECATED`로 남는다. */
  versionNo: number;
  title: string;
  /** 상황 설명. 대화가 시작되는 배경이다. */
  situation: string;
  /** 캐릭터가 먼저 건네는 첫 대사 */
  firstDialogue: string;
  createdAt: string;
}

/**
 * 세계관.
 *
 * 크리에이터가 만드는 콘텐츠의 단위다. **캐릭터 한 명과 시나리오 여러 편**을
 * 품고 있고, 메인 노출 큐레이션이 고르는 대상도 이 세계관이다.
 */
/**
 * 세계관에 등장하는 캐릭터.
 *
 * **세계관과 캐릭터는 N:M이다.** 한 세계관에 여러 캐릭터가 나올 수 있고,
 * 같은 캐릭터가 다른 세계관에도 등장할 수 있다(서버 `universe_character_mappings`).
 * 목록 카드에는 첫 번째 캐릭터를 대표로 쓴다.
 */
export interface UniverseCharacter {
  characterId: number;
  name: string;
  thumbnailUrl: string;
}

/**
 * 세계관 — **목업 큐레이션 구간의 행 타입**이다.
 *
 * 메인 노출(배너 · 오늘의 PICK · 공식 맛보기 · 에셋 추천)과 세계관 선택 모달이
 * 이 모양을 쓴다. 큐레이션은 아직 MSW 목업이고 슬롯도 목업 ID로 저장되어 있어
 * **여기 타입을 실서버 DTO로 바꾸면 큐레이션 화면이 통째로 깨진다.**
 * 실서버 목록 행은 `UniverseListRow`, 상세는 `UniverseDetail`이다.
 */
export interface Universe {
  universeId: number;
  /** 큐레이션에서 "제목"으로 노출된다. */
  name: string;
  /** 큐레이션에서 "설명"으로 노출된다. */
  description: string;
  /** 세계관 대표 이미지. 서버 `profileImageUrl`. */
  thumbnailUrl: string;
  /**
   * 이 세계관에 등장하는 캐릭터. **비어 있을 수 없다.**
   * 캐릭터가 없는 세계관은 대화를 시작할 상대가 없다.
   * 캐릭터 프로필 이미지는 세계관 대표 이미지와 별개로 올린다(서버 `characterProfileUrl`).
   */
  characters: UniverseCharacter[];
  tags: string[];
  /**
   * 이 세계관이 **번역을 갖춘 언어**. 한국어는 항상 포함된다.
   *
   * 메인 노출(배너 · 오늘의 PICK · 공식 맛보기 · 에셋 추천)은 언어별로 목록을
   * 따로 관리하는데, 그 후보를 거르는 기준이 이 값이다. 영어 번역이 없는
   * 세계관을 영어 목록에 실으면 앱에서는 한국어 원문이 그대로 나간다.
   */
  supportedLanguages: ServiceLanguage[];
  /**
   * 공식 여부.
   *
   * **저장된 값이 아니라 조회 시점에 계산된 값이다.**
   * 소유 크리에이터가 공식 계정으로 등록되어 있으면 참이다. 그래서 이 값만
   * 따로 켜고 끌 수 없고, 바꾸려면 `공식 계정`(`/universes/official`)에서
   * 계정을 등록·해제한다.
   */
  isOfficial: boolean;
  /** 소유 크리에이터. 공식 판정의 근거라 목록에서 함께 본다. */
  creatorId: number;
  creatorNickname: string;
  visibility: UniverseVisibility;
  status: UniverseStatus;
  category: UniverseCategory;
  tendency: UniverseTendency;
  reviewStatus: UniverseReviewStatus;
  /** 심사 반려 사유. `reviewStatus`가 `REJECTED`일 때만 있다. */
  reviewRejectionReason?: string;
  /** 댓글 사용 여부. 크리에이터가 세계관마다 정한다. */
  commentEnabled: boolean;
  /** 에셋 추천 정렬 기준 */
  assetCount: number;
  /** 이 세계관에 실린 시나리오(에피소드) 수 */
  scenarioCount: number;
  chatCount: number;
  likeCount: number;
  /** 삭제 요청 시각. `status`가 `DELETED`·`PURGED`일 때만 있다. */
  deletedAt?: string;
  /** 콘텐츠 파기 예정 시각. 이 시각이 지나면 정리 스케줄이 실제로 파기한다. */
  purgeAt?: string;
  /** 실제 파기 완료 시각. `status`가 `PURGED`일 때만 있다. */
  purgedAt?: string;
  createdAt: string;
}

/**
 * 세계관 상세.
 *
 * 목록에는 시나리오를 싣지 않는다. 한 세계관에 열 편이 넘게 달릴 수 있어
 * 목록 응답이 통째로 무거워진다.
 */
/** 세계관의 대표 캐릭터. 목록 카드·배너처럼 한 명만 보여 주는 자리에서 쓴다. */
export const mainCharacterOf = (universe: Universe): UniverseCharacter | undefined =>
  universe.characters[0];

/**
 * 노출 가능 여부·차단 사유 판정에 필요한 최소 상태.
 *
 * 목록 타입(`Universe`)과 실서버 상세 타입(`UniverseDetail`)이 공통으로 가지는
 * 세 값만 본다. 구조가 같으면 어느 쪽이든 그대로 넘길 수 있다.
 */
export interface UniverseExposureState {
  status: UniverseStatus;
  visibility: UniverseVisibility;
  reviewStatus: UniverseReviewStatus;
}

/**
 * 앱에 노출될 수 있는 세계관인지.
 *
 * **메인 노출은 어드민이 정하지만, 노출될 수 있는 상태인지는 세계관이 정한다.**
 * 심사가 끝나지 않았거나 비공개거나 이미 삭제된 세계관을 골라 두면 앱에서는
 * 그 자리가 그냥 빈다. 골라 놓고 나중에 비는 것보다 고를 때 막는 편이 낫다.
 */
export const isExposableUniverse = (universe: UniverseExposureState) =>
  universe.status === "ACTIVE" &&
  universe.visibility === "PUBLIC" &&
  universe.reviewStatus === "APPROVED";

/** 해당 언어 번역을 갖춘 세계관인지. 언어별 큐레이션 후보를 거를 때 쓴다. */
export const supportsLanguage = (
  universe: Pick<Universe, "supportedLanguages">,
  language: ServiceLanguage,
) => universe.supportedLanguages.includes(language);

/**
 * 그 언어 화면에 나갈 수 있는 세계관인지.
 *
 * 노출 가능 상태(승인 · 공개 · 활성)만으로는 부족하다. **번역이 없는 언어의
 * 목록에 실리면 앱에서는 그 자리에 한국어 원문이 나간다.** 언어별 목록은
 * 상태와 번역을 함께 본다.
 */
export const isExposableInLanguage = (
  universe: Universe,
  language: ServiceLanguage,
) => isExposableUniverse(universe) && supportsLanguage(universe, language);

/**
 * 노출될 수 없는 이유. 화면에 그대로 찍는다.
 * 노출 가능하면 `undefined`.
 */
export const universeBlockReason = (
  universe: UniverseExposureState,
): string | undefined => {
  if (universe.status === "PURGED") return "콘텐츠 파기";
  if (universe.status === "DELETED") return "삭제 대기";
  if (universe.status === "INACTIVE") return "비활성";
  if (universe.reviewStatus === "PENDING") return "심사 대기";
  if (universe.reviewStatus === "REJECTED") return "심사 반려";
  if (universe.visibility === "PRIVATE") return "비공개";
  if (universe.visibility === "UNLISTED") return "일부공개";

  return undefined;
};

/**
 * 그 언어 목록에 실을 수 없는 이유.
 *
 * 상태 문제(`universeBlockReason`)를 먼저 보고, 상태가 멀쩡하면 번역 여부를 본다.
 * 번역이 없는 쪽이 더 흔한데 화면에 안 적어 두면 "왜 후보에 없지"를 매번 다시 찾는다.
 */
export const universeLanguageBlockReason = (
  universe: Universe,
  language: ServiceLanguage,
): string | undefined =>
  universeBlockReason(universe) ??
  (supportsLanguage(universe, language)
    ? undefined
    : `${SERVICE_LANGUAGE_LABEL[language]} 번역 없음`);

/* ------------------------------------------------------------------ */
/* 실서버(plat-admin) 세계관 계약                                        */
/*                                                                    */
/* 위 `Universe`/`UniverseScenario`(목업)와 달리 아래 타입은 실서버        */
/* `/admin/universes`(liveAxios) 응답을 화면 용어로 옮긴 것이다.          */
/* 서버 DTO ↔ 화면 타입 변환은 `src/api/universe/*`에서만 한다.           */
/*                                                                    */
/* 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아 이미지 URL을 만들지 못한다.  */
/* URL 필드는 대부분 비어 오고, 화면은 `*FileId`로 이미지를 얻거나 자리표시를    */
/* 둔다. Snowflake ID는 정밀도 손실을 피해 문자열로 다룬다.                  */
/* ------------------------------------------------------------------ */

/** 실서버 세계관 목록 한 줄. 보드가 쓴다. */
export interface AdminUniverseListItem {
  universeId: string;
  title: string;
  introduce: string;
  category: UniverseCategory;
  tendency: UniverseTendency;
  visibility: UniverseVisibility;
  status: UniverseStatus;
  reviewStatus: UniverseReviewStatus;
  chatCount: number;
  likeCount: number;
  commentEnabled: boolean;
  creatorId: string;
  creatorNickname: string;
  /** 대표 이미지 파일 ID. 관리자 서버가 URL을 만들지 못해 보통 ID만 온다. */
  profileImageFileId: string | null;
  /**
   * 서버가 만들어 준 이미지 URL. 관리자 서버는 대개 null을 준다.
   *
   * null이어도 화면은 `profileImageFileId`로 공개 이미지 경로를 조립해
   * 실제 이미지를 그린다(`src/lib/imageUrl.ts`). 이 필드를 남겨 두는 이유는
   * **서버가 URL을 채워 주기 시작하는 날 화면을 고치지 않기 위해서**다.
   */
  profileImageUrl: string | null;
  hashtagCount: number;
  scenarioCount: number;
  /** 번역이 채워진 언어 수 */
  translationCount: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
}

/** 소유 크리에이터 요약. 공식 판정·계정 이동의 근거다. */
export interface UniverseCreatorSummary {
  creatorId: string;
  userId: string | null;
  nickname: string | null;
  grade: string;
  status: string;
}

/** 언어별 세계관 본문. detailSetting은 프롬프트성 원문이라 검수에 쓴다. */
export interface UniverseTranslationView {
  language: ServiceLanguage;
  title: string;
  introduce: string;
  detailSetting: string;
  description: string;
}

/** 세계관에 매핑된 해시태그. 성인·노출 상태를 함께 본다. */
export interface UniverseHashtagView {
  hashtagId: string;
  category: HashtagCategory;
  label: string;
  isAdult: boolean;
  isEnabled: boolean;
}

/** 세계관 대표 캐릭터(상세). */
export interface UniverseCharacterView {
  characterId: string;
  name: string | null;
  profileImageFileId: string | null;
  /** 서버가 만들어 준 URL. 보통 null이며 fileId로 조립한다. */
  profileImageUrl: string | null;
}

/** 세계관 에셋 한 장. 신고 대응 시 실제 이미지를 확인하는 자리다. */
export interface UniverseAssetView {
  assetId: string;
  fileId: string;
  assetName: string;
  assetSituation: string | null;
  /** 관리자 서버가 URL을 만들지 못하면 null. 화면은 자리표시를 둔다. */
  url: string | null;
}

/** 시나리오의 언어별 본문. 유저가 실제로 읽는 에피소드 원문이다. */
export interface UniverseScenarioTranslationView {
  language: ServiceLanguage;
  title: string;
  content: string;
}

/** 시나리오(상세). 상태로 거르지 않고 전부 온다. */
export interface UniverseScenarioDetail {
  scenarioId: string;
  episodeNo: number;
  scenarioType: ScenarioType;
  status: ScenarioLifecycle;
  versionNo: number;
  translations: UniverseScenarioTranslationView[];
}

/**
 * 세계관 상세(실서버).
 *
 * 서비스 경로가 status=ACTIVE만 보는 것과 달리 삭제·파기까지 전부 조회한다.
 * 목록에 없는 번역·에셋·시나리오 본문을 담아 운영 검수에 쓴다.
 */
export interface UniverseDetail {
  universeId: string;
  creator: UniverseCreatorSummary;
  category: UniverseCategory;
  tendency: UniverseTendency;
  visibility: UniverseVisibility;
  status: UniverseStatus;
  reviewStatus: UniverseReviewStatus;
  reviewRejectionReason: string | null;
  commentEnabled: boolean;
  chatCount: number;
  likeCount: number;
  profileImageFileId: string | null;
  /** 서버가 만들어 준 URL. 보통 null이며 fileId로 조립한다. */
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
  purgedAt: string | null;
  translations: UniverseTranslationView[];
  hashtags: UniverseHashtagView[];
  character: UniverseCharacterView | null;
  assets: UniverseAssetView[];
  /** 회차 오름차순으로 정렬되어 온다. */
  scenarios: UniverseScenarioDetail[];
}

/** 채팅 내보내기 작업 */
export type ChatExportStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface ChatExportJob {
  jobId: number;
  targetType: "CHARACTER" | "USER";
  targetId: number;
  targetName: string;
  startDate: string;
  endDate: string;
  status: ChatExportStatus;
  rowCount?: number;
  requestedBy: string;
  createdAt: string;
}
