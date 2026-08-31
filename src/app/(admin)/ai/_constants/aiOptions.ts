import type { BadgeTone, SelectOption } from "@/components/ui";
import type { AiModelRole, AiModelStatus, AiProvider } from "@/type/ai";

/** AI 운영 3개 화면(카탈로그·모델 관리·프롬프트)이 공유하는 라벨·옵션 */
export const AI_PROVIDER_LABEL: Record<AiProvider, string> = {
  ANTHROPIC: "Anthropic",
  OPENAI: "OpenAI",
  GOOGLE: "Google",
  META: "Meta",
};

export const AI_PROVIDER_TONE: Record<AiProvider, BadgeTone> = {
  ANTHROPIC: "brand",
  OPENAI: "success",
  GOOGLE: "info",
  META: "warning",
};

export const AI_MODEL_STATUS_LABEL: Record<AiModelStatus, string> = {
  AVAILABLE: "사용 가능",
  DEPRECATED: "지원 종료 예정",
  UNAVAILABLE: "사용 불가",
};

export const AI_MODEL_STATUS_TONE: Record<AiModelStatus, BadgeTone> = {
  AVAILABLE: "success",
  DEPRECATED: "warning",
  UNAVAILABLE: "danger",
};

export const AI_PROVIDER_FILTER_OPTIONS: SelectOption[] = [
  { label: "전체 제공사", value: "" },
  { label: AI_PROVIDER_LABEL.ANTHROPIC, value: "ANTHROPIC" },
  { label: AI_PROVIDER_LABEL.OPENAI, value: "OPENAI" },
  { label: AI_PROVIDER_LABEL.GOOGLE, value: "GOOGLE" },
  { label: AI_PROVIDER_LABEL.META, value: "META" },
];

/**
 * 화면이 역할을 나열하는 순서. 서비스가 이 모델에 기대는 비중이 큰 순이다.
 *
 * **역할이 무엇무엇인지의 출처는 이 배열이다.** 역할을 더할 때 여기 한 줄을 넣으면
 * 지정 카드와 표 뱃지가 함께 늘어난다. 화면마다 목록을 따로 적으면 한 곳만 고쳤을 때
 * 지정할 수 없는 역할이 표에만 나타난다.
 */
export const AI_MODEL_ROLES: AiModelRole[] = [
  "CHAT_DEFAULT",
  "UNIVERSE_REVIEW",
  "MEMORY_SUMMARY",
];

export const AI_MODEL_ROLE_LABEL: Record<AiModelRole, string> = {
  CHAT_DEFAULT: "기본 대화",
  UNIVERSE_REVIEW: "세계관 심사",
  MEMORY_SUMMARY: "장기기억 요약",
};

/** 지정 카드에서 "이 자리가 무엇을 하는 자리인가"를 설명한다. */
export const AI_MODEL_ROLE_DESCRIPTION: Record<AiModelRole, string> = {
  CHAT_DEFAULT: "모델을 따로 지정하지 않은 대화에 사용합니다.",
  UNIVERSE_REVIEW: "세계관 등록 시 자동으로 도는 심사 AI가 사용합니다.",
  MEMORY_SUMMARY: "대화 기록을 장기기억으로 압축할 때 사용합니다.",
};

export const AI_MODEL_ROLE_TONE: Record<AiModelRole, BadgeTone> = {
  CHAT_DEFAULT: "brand",
  UNIVERSE_REVIEW: "info",
  MEMORY_SUMMARY: "success",
};
