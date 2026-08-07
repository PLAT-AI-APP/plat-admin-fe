import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  CharacterVisibility,
  ChatExportStatus,
  NsfwKeywordLevel,
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

/** 공식 캐릭터 폼에서 고르는 노출 상태 */
export const VISIBILITY_OPTIONS: SelectOption[] = [
  { label: VISIBILITY_LABEL.PUBLIC, value: "PUBLIC" },
  { label: VISIBILITY_LABEL.PRIVATE, value: "PRIVATE" },
  { label: VISIBILITY_LABEL.HIDDEN, value: "HIDDEN" },
];

export const OFFICIAL_FILTER_OPTIONS: SelectOption[] = [
  { label: "공식 여부 전체", value: "" },
  { label: "공식 캐릭터", value: "true" },
  { label: "일반 캐릭터", value: "false" },
];

export const SCENARIO_SORT_OPTIONS: SelectOption[] = [
  { label: "최신 등록순", value: "RECENT" },
  { label: "에셋 많은순", value: "ASSET_COUNT" },
  { label: "대화 많은순", value: "CHAT_COUNT" },
];

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
