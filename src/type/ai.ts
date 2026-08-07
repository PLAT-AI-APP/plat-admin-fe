export type AiProvider = "ANTHROPIC" | "OPENAI" | "GOOGLE" | "META";
export type AiModelStatus = "AVAILABLE" | "DEPRECATED" | "UNAVAILABLE";

/** 카탈로그 상의 모델. 운영 설정과 무관한 원본 정보다. */
export interface AiModelCatalogItem {
  model: string;
  displayName: string;
  provider: AiProvider;
  contextWindow: number;
  status: AiModelStatus;
  /** 1M 토큰 기준 입력 단가 (원) */
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

/** 모델 테스트 호출 결과 */
export interface AiModelPingResult {
  model: string;
  isSuccess: boolean;
  latencyMs: number;
  message: string;
  pingedAt: string;
}

/** 운영에서 사용 중인 모델 설정 */
export interface AiModel {
  modelId: number;
  model: string;
  displayName: string;
  provider: AiProvider;
  isEnabled: boolean;
  isDefault: boolean;
  /** 1회 응답당 차감 크레딧 */
  creditCost: number;
  maxOutputTokens: number;
  temperature: number;
  memo: string;
  updatedAt: string;
}

/** 시스템 프롬프트 */
export interface SystemPrompt {
  promptKey: string;
  label: string;
  description: string;
  activeVersion: number;
  updatedAt: string;
}

export interface SystemPromptVersion {
  versionId: number;
  promptKey: string;
  version: number;
  content: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}
