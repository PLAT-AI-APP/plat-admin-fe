import type { BadgeTone, SelectOption } from "@/components/ui";
import type { AiModelStatus, AiProvider } from "@/type/ai";

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
