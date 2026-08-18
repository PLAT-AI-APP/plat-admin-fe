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
 * 시나리오(에피소드).
 *
 * 세계관이 "무대"라면 시나리오는 **그 무대에서 시작하는 한 편의 이야기**다.
 * 유저는 세계관에 들어가 시나리오를 고르고, 그 시나리오의 상황과 첫 대사로
 * 대화를 시작한다. (plat-fe의 캐릭터 상세 > 시나리오 선택)
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
export interface UniverseDetail extends Universe {
  /** 회차 순으로 정렬되어 온다. */
  scenarios: UniverseScenario[];
}

/** 세계관의 대표 캐릭터. 목록 카드·배너처럼 한 명만 보여 주는 자리에서 쓴다. */
export const mainCharacterOf = (universe: Universe): UniverseCharacter | undefined =>
  universe.characters[0];

/**
 * 앱에 노출될 수 있는 세계관인지.
 *
 * **메인 노출은 어드민이 정하지만, 노출될 수 있는 상태인지는 세계관이 정한다.**
 * 심사가 끝나지 않았거나 비공개거나 이미 삭제된 세계관을 골라 두면 앱에서는
 * 그 자리가 그냥 빈다. 골라 놓고 나중에 비는 것보다 고를 때 막는 편이 낫다.
 */
export const isExposableUniverse = (universe: Universe) =>
  universe.status === "ACTIVE" &&
  universe.visibility === "PUBLIC" &&
  universe.reviewStatus === "APPROVED";

/**
 * 노출될 수 없는 이유. 화면에 그대로 찍는다.
 * 노출 가능하면 `undefined`.
 */
export const universeBlockReason = (universe: Universe): string | undefined => {
  if (universe.status === "PURGED") return "콘텐츠 파기";
  if (universe.status === "DELETED") return "삭제 대기";
  if (universe.status === "INACTIVE") return "비활성";
  if (universe.reviewStatus === "PENDING") return "심사 대기";
  if (universe.reviewStatus === "REJECTED") return "심사 반려";
  if (universe.visibility === "PRIVATE") return "비공개";
  if (universe.visibility === "UNLISTED") return "일부공개";

  return undefined;
};

/** NSFW 키워드 */
export type NsfwKeywordLevel = "BLOCK" | "WARN";

export interface NsfwKeyword {
  keywordId: number;
  keyword: string;
  level: NsfwKeywordLevel;
  hitCount: number;
  createdAt: string;
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
