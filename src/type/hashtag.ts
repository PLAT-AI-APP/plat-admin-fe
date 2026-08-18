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
 * plat-fe는 `/hashtag/list?lang=KO` 형태로 언어별 목록을 받아가므로
 * 라벨을 언어별로 관리한다.
 */

/** 해시태그 라벨도 서비스 공용 언어 목록을 그대로 쓴다. */
export type HashtagLanguage = ServiceLanguage;

export const HASHTAG_LANGUAGES = SERVICE_LANGUAGES;
export const HASHTAG_LANGUAGE_LABEL = SERVICE_LANGUAGE_LABEL;

/**
 * 사용자가 태그를 고를 때 묶어서 보여주는 분류.
 * 앱의 태그 선택 화면에서 이 순서대로 접이식 섹션으로 노출된다.
 */
export type HashtagCategory =
  | "GENRE"
  | "SPECIES"
  | "CHARACTER"
  | "APPEARANCE"
  | "PERSONALITY"
  | "RELATION"
  | "NARRATIVE"
  | "OCCUPATION"
  | "SPECIAL";

/** 앱 노출 순서와 동일하게 유지한다. */
export const HASHTAG_CATEGORIES: HashtagCategory[] = [
  "GENRE",
  "SPECIES",
  "CHARACTER",
  "APPEARANCE",
  "PERSONALITY",
  "RELATION",
  "NARRATIVE",
  "OCCUPATION",
  "SPECIAL",
];

export const HASHTAG_CATEGORY_LABEL: Record<HashtagCategory, string> = {
  GENRE: "장르",
  SPECIES: "종족",
  CHARACTER: "캐릭터",
  APPEARANCE: "외형",
  PERSONALITY: "성격",
  RELATION: "관계",
  NARRATIVE: "서사",
  OCCUPATION: "직업",
  SPECIAL: "특수설정",
};

export interface Hashtag {
  hashtagId: number;
  /** 언어별 노출 라벨. KO는 필수, 나머지는 비어 있으면 KO로 대체된다. */
  labels: Record<HashtagLanguage, string>;
  category: HashtagCategory;
  /** 성인 태그. 성인 인증 유저에게만 노출된다. */
  isAdult: boolean;
  /** 노출 여부. 끄면 사용자 선택 목록에서 사라진다. */
  isActive: boolean;
  /** 이 태그를 사용 중인 세계관 수 (삭제 판단 근거) */
  usageCount: number;
  createdAt: string;
}

export interface HashtagFormValues {
  labels: Record<HashtagLanguage, string>;
  category: HashtagCategory;
  isAdult: boolean;
  isActive: boolean;
}

/** 목록에서 대표로 보여줄 라벨. 번역이 없으면 한국어로 대체한다. */
export const resolveHashtagLabel = (
  hashtag: Hashtag,
  language: HashtagLanguage = "KO",
): string => hashtag.labels[language] || hashtag.labels.KO;

/** 번역이 채워진 언어 수 */
export const countTranslations = countFilledLanguages;
