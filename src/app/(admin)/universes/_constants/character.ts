import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  CharacterVisibility,
  ChatExportStatus,
  NsfwKeywordLevel,
  ScenarioLifecycle,
  ScenarioType,
  UniverseCategory,
  UniverseReviewStatus,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
} from "@/type/character";

/**
 * 캐릭터 도메인 화면들이 공유하는 라벨 · 뱃지 톤 정의.
 * 같은 상태를 화면마다 다른 색으로 칠하지 않기 위해 한 곳에 모아 둔다.
 */

export const VISIBILITY_LABEL: Record<CharacterVisibility, string> = {
  PUBLIC: "공개",
  PRIVATE: "비공개",
  HIDDEN: "숨김",
};

export const VISIBILITY_TONE: Record<CharacterVisibility, BadgeTone> = {
  PUBLIC: "success",
  PRIVATE: "neutral",
  HIDDEN: "warning",
};

/** 노출 상태 필터. 빈 문자열이 "전체"다. */
export const VISIBILITY_FILTER_OPTIONS: SelectOption[] = [
  { label: "노출 상태 전체", value: "" },
  { label: VISIBILITY_LABEL.PUBLIC, value: "PUBLIC" },
  { label: VISIBILITY_LABEL.PRIVATE, value: "PRIVATE" },
  { label: VISIBILITY_LABEL.HIDDEN, value: "HIDDEN" },
];

export const OFFICIAL_FILTER_OPTIONS: SelectOption[] = [
  { label: "공식 여부 전체", value: "" },
  { label: "공식 캐릭터", value: "true" },
  { label: "일반 캐릭터", value: "false" },
];

export const UNIVERSE_SORT_OPTIONS: SelectOption[] = [
  { label: "최신 등록순", value: "RECENT" },
  { label: "에셋 많은순", value: "ASSET_COUNT" },
  { label: "대화 많은순", value: "CHAT_COUNT" },
];

/* ------------------------------------------------------------------ */
/* 세계관 (서버 Universe 계약)                                           */
/* ------------------------------------------------------------------ */

export const UNIVERSE_VISIBILITY_LABEL: Record<UniverseVisibility, string> = {
  PUBLIC: "공개",
  PRIVATE: "비공개",
  UNLISTED: "일부공개",
};

export const UNIVERSE_VISIBILITY_TONE: Record<UniverseVisibility, BadgeTone> = {
  PUBLIC: "success",
  PRIVATE: "neutral",
  UNLISTED: "info",
};

/** 상태 라벨은 서버 `UniverseStatus.description`을 그대로 따른다. */
export const UNIVERSE_STATUS_LABEL: Record<UniverseStatus, string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
  DELETED: "삭제 대기",
  PURGED: "콘텐츠 파기",
};

export const UNIVERSE_STATUS_TONE: Record<UniverseStatus, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  // 파기 전이라 복구 문의를 받을 수 있는 구간이다. 파기 완료와 같은 색으로 두지 않는다.
  DELETED: "warning",
  PURGED: "danger",
};

export const UNIVERSE_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "상태 전체", value: "" },
  { label: UNIVERSE_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: UNIVERSE_STATUS_LABEL.INACTIVE, value: "INACTIVE" },
  { label: UNIVERSE_STATUS_LABEL.DELETED, value: "DELETED" },
  { label: UNIVERSE_STATUS_LABEL.PURGED, value: "PURGED" },
];

export const UNIVERSE_REVIEW_LABEL: Record<UniverseReviewStatus, string> = {
  PENDING: "심사 대기",
  APPROVED: "승인",
  REJECTED: "반려",
};

export const UNIVERSE_REVIEW_TONE: Record<UniverseReviewStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export const UNIVERSE_REVIEW_FILTER_OPTIONS: SelectOption[] = [
  { label: "심사 전체", value: "" },
  { label: UNIVERSE_REVIEW_LABEL.PENDING, value: "PENDING" },
  { label: UNIVERSE_REVIEW_LABEL.APPROVED, value: "APPROVED" },
  { label: UNIVERSE_REVIEW_LABEL.REJECTED, value: "REJECTED" },
];

export const UNIVERSE_CATEGORY_LABEL: Record<UniverseCategory, string> = {
  ROMANCE: "로맨스",
  FANTASY: "판타지",
  DRAMA: "드라마",
  MARTIAL_ARTS: "무협",
  GL: "GL",
  BL: "BL",
  HORROR: "호러",
  MYSTERY: "미스터리",
};

export const UNIVERSE_TENDENCY_LABEL: Record<UniverseTendency, string> = {
  ALL: "전체",
  MALE_ORIENTED: "남성향",
  FEMALE_ORIENTED: "여성향",
};

/* ------------------------------------------------------------------ */
/* 시나리오 (세계관 안의 에피소드)                                        */
/* ------------------------------------------------------------------ */

export const SCENARIO_TYPE_LABEL: Record<ScenarioType, string> = {
  START: "시작",
  NORMAL: "일반",
  EVENT: "이벤트",
  ENDING: "엔딩",
};

export const SCENARIO_TYPE_TONE: Record<ScenarioType, BadgeTone> = {
  // 시작 시나리오는 세계관에 반드시 하나 있어야 해서 눈에 띄게 둔다.
  START: "brand",
  NORMAL: "neutral",
  EVENT: "info",
  ENDING: "warning",
};

export const SCENARIO_TYPE_HINT: Record<ScenarioType, string> = {
  START: "세계관에 처음 들어왔을 때 시작하는 시나리오입니다.",
  NORMAL: "이어서 진행하는 일반 시나리오입니다.",
  EVENT: "특정 조건에서 열리는 이벤트 시나리오입니다.",
  ENDING: "이야기를 마무리하는 시나리오입니다.",
};

export const SCENARIO_LIFECYCLE_LABEL: Record<ScenarioLifecycle, string> = {
  ACTIVE: "사용 중",
  HIDDEN: "숨김",
  DEPRECATED: "구버전",
};

export const SCENARIO_LIFECYCLE_TONE: Record<ScenarioLifecycle, BadgeTone> = {
  ACTIVE: "success",
  HIDDEN: "neutral",
  DEPRECATED: "warning",
};

export const NSFW_LEVEL_LABEL: Record<NsfwKeywordLevel, string> = {
  BLOCK: "차단",
  WARN: "경고",
};

export const NSFW_LEVEL_TONE: Record<NsfwKeywordLevel, BadgeTone> = {
  BLOCK: "danger",
  WARN: "warning",
};

/** 키워드 등록 폼용 옵션 */
export const NSFW_LEVEL_OPTIONS: SelectOption[] = [
  { label: `${NSFW_LEVEL_LABEL.BLOCK} (생성 차단)`, value: "BLOCK" },
  { label: `${NSFW_LEVEL_LABEL.WARN} (경고만)`, value: "WARN" },
];

export const NSFW_LEVEL_FILTER_OPTIONS: SelectOption[] = [
  { label: "레벨 전체", value: "" },
  { label: NSFW_LEVEL_LABEL.BLOCK, value: "BLOCK" },
  { label: NSFW_LEVEL_LABEL.WARN, value: "WARN" },
];

export const EXPORT_STATUS_LABEL: Record<ChatExportStatus, string> = {
  PENDING: "대기",
  PROCESSING: "처리 중",
  DONE: "완료",
  FAILED: "실패",
};

export const EXPORT_STATUS_TONE: Record<ChatExportStatus, BadgeTone> = {
  PENDING: "neutral",
  PROCESSING: "info",
  DONE: "success",
  FAILED: "danger",
};

export const EXPORT_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "상태 전체", value: "" },
  { label: EXPORT_STATUS_LABEL.PENDING, value: "PENDING" },
  { label: EXPORT_STATUS_LABEL.PROCESSING, value: "PROCESSING" },
  { label: EXPORT_STATUS_LABEL.DONE, value: "DONE" },
  { label: EXPORT_STATUS_LABEL.FAILED, value: "FAILED" },
];
