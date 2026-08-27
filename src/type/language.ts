/**
 * 서비스가 지원하는 언어. **앱 노출 순서와 동일하게 유지한다.**
 *
 * 해시태그 · 배너처럼 앱에 그대로 노출되는 문구도, 메인 노출 목록(배너 ·
 * 오늘의 PICK · 공식 맛보기 · 에셋 추천)도 전부 언어별로 관리한다.
 * plat-fe가 `?lang=KO` 형태로 언어를 지정해 가져가기 때문에, 한 곳에서만
 * 목록을 정의하고 각 도메인이 가져다 쓴다.
 *
 * 목록이 곧 타입이다(`ServiceLanguage`). 스키마(`z.enum`)도 이 상수를 그대로
 * 받으므로 언어를 늘릴 때 고칠 곳이 여기 하나로 끝난다.
 */
export const SERVICE_LANGUAGES = ["KO", "EN", "JA", "ZH", "TH", "VI"] as const;

export type ServiceLanguage = (typeof SERVICE_LANGUAGES)[number];

export const SERVICE_LANGUAGE_LABEL: Record<ServiceLanguage, string> = {
  KO: "한국어",
  EN: "영어",
  JA: "일본어",
  ZH: "중국어",
  TH: "태국어",
  VI: "베트남어",
};

/** 언어별 문구 묶음. 한국어는 필수이고, 비어 있는 언어는 한국어로 대체한다. */
export type LocalizedText = Record<ServiceLanguage, string>;

export const EMPTY_LOCALIZED_TEXT: LocalizedText = {
  KO: "",
  EN: "",
  JA: "",
  ZH: "",
  TH: "",
  VI: "",
};

/** 해당 언어 문구. 번역이 없으면 한국어로 대체한다. */
export const resolveLocalizedText = (
  text: Partial<LocalizedText> | undefined,
  language: ServiceLanguage = "KO",
): string => text?.[language]?.trim() || text?.KO?.trim() || "";

/** 번역이 채워진 언어 수 */
export const countFilledLanguages = (text: Partial<LocalizedText>) =>
  SERVICE_LANGUAGES.filter((language) => text[language]?.trim()).length;
