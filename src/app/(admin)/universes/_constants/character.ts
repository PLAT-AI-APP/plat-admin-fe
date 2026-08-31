import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  CharacterVisibility,
  ChatExportStatus,
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

/**
 * 상태 라벨.
 *
 * 세계관 삭제는 하드 딜리트라 "삭제 대기"·"콘텐츠 파기"가 없다. 지운 세계관은
 * 데이터째 사라져 목록에도 상세에도 나타나지 않으므로, 화면이 칠할 상태는
 * 운영 중과 내려둔 것 둘뿐이다.
 */
export const UNIVERSE_STATUS_LABEL: Record<UniverseStatus, string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
};

export const UNIVERSE_STATUS_TONE: Record<UniverseStatus, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

export const UNIVERSE_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "상태 전체", value: "" },
  { label: UNIVERSE_STATUS_LABEL.ACTIVE, value: "ACTIVE" },
  { label: UNIVERSE_STATUS_LABEL.INACTIVE, value: "INACTIVE" },
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

/** 보드 필터/정렬 옵션. 서버 실목록(liveAxios)이 받는 값과 이름을 맞춘다. */
export const UNIVERSE_CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { label: "장르 전체", value: "" },
  { label: UNIVERSE_CATEGORY_LABEL.ROMANCE, value: "ROMANCE" },
  { label: UNIVERSE_CATEGORY_LABEL.FANTASY, value: "FANTASY" },
  { label: UNIVERSE_CATEGORY_LABEL.DRAMA, value: "DRAMA" },
  { label: UNIVERSE_CATEGORY_LABEL.MARTIAL_ARTS, value: "MARTIAL_ARTS" },
  { label: UNIVERSE_CATEGORY_LABEL.GL, value: "GL" },
  { label: UNIVERSE_CATEGORY_LABEL.BL, value: "BL" },
  { label: UNIVERSE_CATEGORY_LABEL.HORROR, value: "HORROR" },
  { label: UNIVERSE_CATEGORY_LABEL.MYSTERY, value: "MYSTERY" },
];

export const UNIVERSE_VISIBILITY_FILTER_OPTIONS: SelectOption[] = [
  { label: "공개 범위 전체", value: "" },
  { label: UNIVERSE_VISIBILITY_LABEL.PUBLIC, value: "PUBLIC" },
  { label: UNIVERSE_VISIBILITY_LABEL.PRIVATE, value: "PRIVATE" },
  { label: UNIVERSE_VISIBILITY_LABEL.UNLISTED, value: "UNLISTED" },
];

/** 정렬 기준. 값은 서버 `UniverseOrderBy` enum과 같다. */
export const UNIVERSE_ORDER_OPTIONS: SelectOption[] = [
  { label: "최근 등록순", value: "CREATED_DESC" },
  { label: "오래된순", value: "CREATED_ASC" },
  { label: "대화 많은순", value: "CHAT_DESC" },
  { label: "좋아요 많은순", value: "LIKE_DESC" },
  { label: "제목 오름차순", value: "TITLE_ASC" },
  { label: "제목 내림차순", value: "TITLE_DESC" },
];

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
