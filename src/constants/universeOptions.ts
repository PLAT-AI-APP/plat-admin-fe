import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  CharacterVisibility,
  ChatExportStatus,
  ScenarioLifecycle,
  ScenarioType,
  UniverseModerationStatus,
  UniverseStatus,
  UniverseTendency,
  UniverseVisibility,
} from "@/type/character";
import type { ContentReviewStatus } from "@/type/contentReview";

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
 * 삭제는 소프트 삭제라 지운 세계관도 "삭제 대기" → "콘텐츠 파기"로 목록 · 상세에 남는다.
 * 탈퇴한 제작자가 남긴 세계관은 심사가 끝날 때까지 "인수 대기"다.
 */
export const UNIVERSE_STATUS_LABEL: Record<UniverseStatus, string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
  ORPHANED: "인수 대기",
  DELETED: "삭제 대기",
  PURGED: "콘텐츠 파기",
};

export const UNIVERSE_STATUS_TONE: Record<UniverseStatus, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  ORPHANED: "warning",
  DELETED: "danger",
  PURGED: "danger",
};

export const UNIVERSE_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "상태 전체", value: "" },
  ...(Object.keys(UNIVERSE_STATUS_LABEL) as UniverseStatus[]).map((status) => ({
    label: UNIVERSE_STATUS_LABEL[status],
    value: status,
  })),
];

/** 운영 제한 라벨. 콘텐츠 검수 결과가 아니라 운영자가 직접 건 제한이다. */
export const UNIVERSE_MODERATION_LABEL: Record<
  UniverseModerationStatus,
  string
> = {
  CLEAR: "정상",
  BLOCKED: "운영 제한",
};

export const UNIVERSE_MODERATION_TONE: Record<
  UniverseModerationStatus,
  BadgeTone
> = {
  CLEAR: "success",
  BLOCKED: "danger",
};

export const UNIVERSE_MODERATION_FILTER_OPTIONS: SelectOption[] = [
  { label: "제한 전체", value: "" },
  { label: UNIVERSE_MODERATION_LABEL.CLEAR, value: "CLEAR" },
  { label: "제한됨", value: "BLOCKED" },
];

/**
 * 콘텐츠 검수 판정 라벨.
 *
 * 운영 제한(`moderationStatus`)과 **다른 축**이다. 운영 제한은 운영자가 직접 건
 * 것이고, 이쪽은 AI · 관리자 심사의 결과다. 둘 다 정상이어야 앱에 보인다.
 *
 * 서버는 검수 작업이 하나도 없는 세계관도 `PENDING`으로 내려준다
 * (`UniverseAdminService.toDetail`의 `getOrDefault`). "검수 기록 없음"은
 * 따로 구분하지 않는다 — 아직 통과하지 못했다는 뜻은 같기 때문이다.
 */
export const UNIVERSE_REVIEW_LABEL: Record<ContentReviewStatus, string> = {
  PENDING: "검수 대기",
  APPROVED: "검수 승인",
  REJECTED: "검수 반려",
};

/**
 * 대기를 회색이 아니라 경고색으로 둔다. 대기는 "아직 아무 일도 없음"이 아니라
 * **앱에 안 보이는 상태**라, 노출 사유 한 줄과 같은 무게로 읽혀야 한다.
 */
export const UNIVERSE_REVIEW_TONE: Record<ContentReviewStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export const UNIVERSE_TENDENCY_LABEL: Record<UniverseTendency, string> = {
  ALL: "전체",
  MALE_ORIENTED: "남성향",
  FEMALE_ORIENTED: "여성향",
};

/**
 * 성향 표시색.
 *
 * 성향은 값이 셋뿐이고 거의 바뀌지 않아, 표에서 한 칸을 차지할 만한 정보가
 * 아니다. 제목 옆 점 하나로 구분하고 칸은 지표에 내준다. 뱃지 톤(`BadgeTone`)이
 * 아니라 색값을 직접 두는 이유는, 이 색이 상태(성공·경고)를 뜻하지 않고
 * 성향끼리만 구분하면 되는 분류색이기 때문이다.
 */
export const UNIVERSE_TENDENCY_COLOR: Record<UniverseTendency, string> = {
  ALL: "#AA8BD8",
  MALE_ORIENTED: "#60A5FA",
  FEMALE_ORIENTED: "#F472B6",
};

/** 보드 필터/정렬 옵션. 서버 실목록(liveAxios)이 받는 값과 이름을 맞춘다. */
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

/**
 * 성인 분류 필터. 서버는 Boolean 쿼리(`adult=true|false`)로 받는다.
 * 빈 문자열이 "전체"다.
 */
export const UNIVERSE_ADULT_FILTER_OPTIONS: SelectOption[] = [
  { label: "성인 분류 전체", value: "" },
  { label: "성인", value: "true" },
  { label: "일반", value: "false" },
];
