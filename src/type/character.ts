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
  isOfficial: boolean;
  visibility: CharacterVisibility;
  status: CharacterStatus;
  isNsfw: boolean;
  tags: string[];
  scenarioCount: number;
  assetCount: number;
  chatCount: number;
  likeCount: number;
  createdAt: string;
}

export interface CharacterDetail extends Character {
  description: string;
  greeting: string;
  personality: string;
  scenarios: Scenario[];
  updatedAt: string;
}

/**
 * 세계관.
 * 캐릭터에 속한 하위 엔티티이며(캐릭터당 최대 5개),
 * 메인 노출 큐레이션의 선택 대상이다.
 */
export interface Scenario {
  scenarioId: number;
  characterId: number;
  characterName: string;
  /** 큐레이션에서 "제목"으로 노출된다. */
  name: string;
  /** 큐레이션에서 "설명"으로 노출된다. */
  description: string;
  thumbnailUrl: string;
  tags: string[];
  isOfficial: boolean;
  /** 에셋 추천 정렬 기준 */
  assetCount: number;
  chatCount: number;
  createdAt: string;
}

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
