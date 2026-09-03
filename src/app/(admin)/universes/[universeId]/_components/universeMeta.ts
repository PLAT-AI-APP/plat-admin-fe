import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  UniverseDetail,
  UniverseScenarioTranslationView,
  UniverseTranslationView,
} from "@/type/character";
import { SERVICE_LANGUAGES, type ServiceLanguage } from "@/type/language";
import {
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_TENDENCY_LABEL,
  UNIVERSE_VISIBILITY_LABEL,
} from "../../_constants/character";

/**
 * 세계관 상세 화면에서만 쓰는 라벨 · 계산.
 *
 * 도메인 공통 라벨은 `_constants/character.ts`에 있다. 여기에는 **상세 화면이
 * 처음 쓰기 시작한 것**만 둔다 — 크리에이터 등급·상태 뱃지, 조치 폼의 선택지처럼
 * 목록에는 없는 값들이다.
 */

/* ------------------------------------------------------------------ */
/* 크리에이터 위험 신호                                                  */
/* ------------------------------------------------------------------ */

/**
 * 크리에이터 등급. 서버 `CreatorGrade`와 같다.
 *
 * 상세 응답의 `grade`·`status`는 서버가 문자열로 준다(타입이 열려 있다).
 * 모르는 값이 와도 화면이 비지 않도록 라벨은 조회 실패 시 원문을 그대로 쓴다.
 */
const CREATOR_GRADE_LABEL: Record<string, string> = {
  NEW: "신규",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
};

const CREATOR_STATUS_LABEL: Record<string, string> = {
  PENDING: "승인 대기",
  APPROVED: "승인",
  SUSPENDED: "정지",
  REVOKED: "자격 회수",
};

const CREATOR_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  SUSPENDED: "danger",
  REVOKED: "danger",
};

export const creatorGradeLabel = (grade: string) =>
  CREATOR_GRADE_LABEL[grade] ?? grade;

export const creatorStatusLabel = (status: string) =>
  CREATOR_STATUS_LABEL[status] ?? status;

export const creatorStatusTone = (status: string): BadgeTone =>
  CREATOR_STATUS_TONE[status] ?? "neutral";

/**
 * 조치 판단에 걸리는 크리에이터인지.
 *
 * 정지·회수된 크리에이터의 세계관은 심사를 통과시켜도 계정 쪽에서 다시 내려갈
 * 수 있다. 승인 버튼을 누르기 전에 알아야 하는 사실이라 상단에 경고로 띄운다.
 */
export const isRiskyCreatorStatus = (status: string) =>
  status === "SUSPENDED" || status === "REVOKED";

/* ------------------------------------------------------------------ */
/* 조치 폼 선택지                                                        */
/* ------------------------------------------------------------------ */

/**
 * 공개 범위 선택지. 목록 필터(`UNIVERSE_VISIBILITY_FILTER_OPTIONS`)와 달리
 * "전체"(빈 값)가 없다 — 조치 폼에서 빈 값을 보내면 422다.
 */
export const UNIVERSE_VISIBILITY_OPTIONS: SelectOption[] = [
  { label: `${UNIVERSE_VISIBILITY_LABEL.PUBLIC} (앱 노출)`, value: "PUBLIC" },
  {
    label: `${UNIVERSE_VISIBILITY_LABEL.PRIVATE} (크리에이터만)`,
    value: "PRIVATE",
  },
  {
    label: `${UNIVERSE_VISIBILITY_LABEL.UNLISTED} (링크로만)`,
    value: "UNLISTED",
  },
];

export const UNIVERSE_CATEGORY_OPTIONS: SelectOption[] = (
  Object.keys(UNIVERSE_CATEGORY_LABEL) as (keyof typeof UNIVERSE_CATEGORY_LABEL)[]
).map((value) => ({ label: UNIVERSE_CATEGORY_LABEL[value], value }));

export const UNIVERSE_TENDENCY_OPTIONS: SelectOption[] = (
  Object.keys(UNIVERSE_TENDENCY_LABEL) as (keyof typeof UNIVERSE_TENDENCY_LABEL)[]
).map((value) => ({ label: UNIVERSE_TENDENCY_LABEL[value], value }));

/* ------------------------------------------------------------------ */
/* 번역                                                                */
/* ------------------------------------------------------------------ */

/**
 * 세계관 번역이 실제로 채워졌는지.
 *
 * 서버는 언어 행을 만들어 두고 본문만 비워 두는 경우가 있다. 행이 있다는 이유로
 * "번역됨"으로 세면 커버리지 숫자가 실제보다 커진다.
 */
export const isFilledUniverseTranslation = (
  translation: UniverseTranslationView,
): boolean =>
  Boolean(
    translation.title.trim() ||
      translation.introduce.trim() ||
      translation.description.trim(),
  );

/** 시나리오 번역은 유저가 읽는 본문(`content`)이 있어야 채워진 것이다. */
export const isFilledScenarioTranslation = (
  translation: UniverseScenarioTranslationView,
): boolean => Boolean(translation.title.trim() || translation.content.trim());

/**
 * 채워진 언어 목록. 앱 노출 순서(`SERVICE_LANGUAGES`)를 유지한다.
 *
 * `countFilledLanguages`는 `Record<언어, 문자열>` 모양을 받으므로 번역 배열에는
 * 쓸 수 없다. 배열 응답을 같은 순서로 훑는 것이 이 함수의 역할이다.
 */
export const filledLanguagesOf = <T extends { language: ServiceLanguage }>(
  translations: T[],
  isFilled: (translation: T) => boolean,
): ServiceLanguage[] =>
  SERVICE_LANGUAGES.filter((language) => {
    const found = translations.find((item) => item.language === language);

    return Boolean(found && isFilled(found));
  });

/** 세계관 대표 제목. 한국어 번역을 우선하고 없으면 첫 번역을 쓴다. */
export const universeTitleOf = (universe: UniverseDetail): string => {
  const ko = universe.translations.find((t) => t.language === "KO");

  return (ko ?? universe.translations[0])?.title?.trim() || "제목 없음";
};
