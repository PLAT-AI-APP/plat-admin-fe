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

/**
 * 시스템 프롬프트의 종류.
 *
 * 어떤 프롬프트가 존재하는지는 서버의 `SystemPromptKey` enum이 정한다.
 * 여기 적는 것은 서버가 내려주는 값을 좁혀 두는 것일 뿐, 목록의 출처가 아니다.
 */
export type SystemPromptKey =
  | "SAFETY_FILTER"
  | "UNIVERSE_CHAT"
  | "UNIVERSE_REVIEW";

/**
 * 시스템 프롬프트.
 *
 * **활성 버전이 없을 수 있다.** 서버에 키를 새로 더하면 그 키는 버전이 하나도 없는 채로
 * 목록에 나타난다. 그때는 `activeVersion`과 `updatedAt`이 함께 비어 있다.
 */
export interface SystemPrompt {
  promptKey: SystemPromptKey;
  label: string;
  description: string;
  activeVersion: number | null;
  /**
   * 지금까지 **발급한** 마지막 번호. 남아 있는 버전의 최대값이 아니다.
   *
   * v3을 지워도 이 값은 3으로 남고 다음 저장은 v4를 받는다. 다음 번호를 이력에서
   * 세면 지운 번호를 다시 쓰겠다고 말하게 되므로, 화면은 언제나 이 값을 쓴다.
   */
  latestVersion: number;
  updatedAt: string | null;
}

export interface SystemPromptVersion {
  versionId: number;
  promptKey: SystemPromptKey;
  version: number;
  content: string;
  isActive: boolean;
  createdBy: string;
  /** 등록 관리자 계정 ID. 계정이 삭제되면 이름만 남는다. */
  createdById?: number;
  createdAt: string;
}
