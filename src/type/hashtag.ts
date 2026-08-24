import {
  SERVICE_LANGUAGES,
  SERVICE_LANGUAGE_LABEL,
  countFilledLanguages,
  type ServiceLanguage,
} from "./language";

/**
 * 해시태그.
 *
 * 사용자가 자유롭게 입력하는 값이 아니라, **관리자가 미리 만들어 둔 목록에서
 * 가져다 쓰는** 값이다. 따라서 여기서 만들지 않은 태그는 앱에 노출되지 않는다.
 *
 * 이 도메인은 실서버(`plat-be` `plat-admin`)에 연동되어 있다. 타입은 서버 DTO를
 * 그대로 따르지 않고 관리자 화면 용어(`isActive` · `hashtagId`)로 맞춰 두고,
 * 서버 응답 ↔ 화면 타입 변환은 `src/api/hashtag`에서만 한다.
 */

/** 해시태그 라벨도 서비스 공용 언어 목록을 그대로 쓴다. */
export type HashtagLanguage = ServiceLanguage;

export const HASHTAG_LANGUAGES = SERVICE_LANGUAGES;
export const HASHTAG_LANGUAGE_LABEL = SERVICE_LANGUAGE_LABEL;

/**
 * 사용자가 태그를 고를 때 묶어서 보여주는 분류.
 * **서버 `HashtagCategory` enum과 이름·순서가 같아야 한다.**
 */
export type HashtagCategory =
  | "GENRE"
  | "BACKGROUND"
  | "RACE"
  | "CHARACTER"
  | "APPEARANCE"
  | "PERSONALITY"
  | "RELATIONSHIP"
  | "NARRATIVE"
  | "OCCUPATION"
  | "MOOD"
  | "SPECIAL";

/** 서버 enum 선언 순서를 그대로 따른다. */
export const HASHTAG_CATEGORIES: HashtagCategory[] = [
  "GENRE",
  "BACKGROUND",
  "RACE",
  "CHARACTER",
  "APPEARANCE",
  "PERSONALITY",
  "RELATIONSHIP",
  "NARRATIVE",
  "OCCUPATION",
  "MOOD",
  "SPECIAL",
];

/** 서버 enum의 `tagName`과 같은 문구를 쓴다. */
export const HASHTAG_CATEGORY_LABEL: Record<HashtagCategory, string> = {
  GENRE: "장르",
  BACKGROUND: "배경",
  RACE: "종족",
  CHARACTER: "캐릭터",
  APPEARANCE: "외형",
  PERSONALITY: "성격",
  RELATIONSHIP: "관계",
  NARRATIVE: "서사",
  OCCUPATION: "직업",
  MOOD: "분위기",
  SPECIAL: "특수설정",
};

/** 목록 정렬. 서버 `OrderBy` 값을 그대로 쓴다. */
export type HashtagSort =
  | "CREATED_DESC"
  | "CREATED_ASC"
  | "USAGE_DESC"
  | "USAGE_ASC"
  | "NAME_ASC"
  | "NAME_DESC";

/**
 * 목록 행.
 *
 * **목록에는 언어별 라벨이 오지 않는다.** 서버가 한국어 라벨(`name`)과 번역이
 * 채워진 개수만 주므로, 번역 내용은 상세(`HashtagDetail`)에서 확인한다.
 */
export interface Hashtag {
  hashtagId: number;
  /** 한국어 라벨. 다른 언어 번역이 없을 때 앱에서 쓰는 대체 라벨이기도 하다. */
  name: string;
  category: HashtagCategory;
  /** 번역이 채워진 언어 수 (한국어 포함) */
  translationCount: number;
  /** 서버가 지원하는 언어 수. "번역 n/m" 표기의 분모다. */
  totalTranslationCount: number;
  /** 이 태그를 사용 중인 캐릭터·세계관 수 (삭제 판단 근거) */
  usageCount: number;
  /** 성인 태그. 성인 인증 유저에게만 노출된다. */
  isAdult: boolean;
  /** 노출 여부. 끄면 사용자 선택 목록에서 사라진다. */
  isActive: boolean;
  createdAt: string;
}

/** 상세. 언어별 라벨은 여기에만 있다. */
export interface HashtagDetail {
  hashtagId: number;
  /** 언어별 노출 라벨. KO는 필수, 나머지는 비어 있으면 KO로 대체된다. */
  labels: Record<HashtagLanguage, string>;
  category: HashtagCategory;
  isAdult: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface HashtagFormValues {
  labels: Record<HashtagLanguage, string>;
  category: HashtagCategory;
  isAdult: boolean;
  isActive: boolean;
}

/** 번역이 채워진 언어 수 */
export const countTranslations = countFilledLanguages;
