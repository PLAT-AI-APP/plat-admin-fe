export type AiKeyProvider = "ANTHROPIC" | "OPENAI" | "GOOGLE";
export type AiKeySlot = "MAIN" | "SUB";

export const AI_KEY_PROVIDER_LABEL: Record<AiKeyProvider, string> = {
  ANTHROPIC: "Anthropic (Claude)",
  OPENAI: "OpenAI (GPT)",
  GOOGLE: "Google (Gemini)",
};

export const AI_KEY_SLOT_LABEL: Record<AiKeySlot, string> = {
  MAIN: "메인",
  SUB: "서브",
};

export interface AiKeySlotState {
  slot: AiKeySlot;
  /** false 면 저장소에 없다. 이때 서버는 배포 환경 변수 키가 있으면 그것을 쓴다. */
  registered: boolean;
  /** 끝 4자리만 (…abcd). 원문은 내려오지 않는다. */
  maskedKey: string | null;
  expiresOn: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AiKeyProviderState {
  provider: AiKeyProvider;
  activeSlot: AiKeySlot;
  fallbackReason: string | null;
  fallbackSince: string | null;
  /** 있으면 그 시각에 저절로 메인으로 돌아간다(요청 한도 초과). */
  fallbackUntil: string | null;
  slots: AiKeySlotState[];
}

export interface AiKeyInstanceState {
  instanceId: string;
  /** "PROVIDER/SLOT" → 끝 4자리 */
  maskedKeys: Record<string, string>;
  keyVersion: number;
  upToDate: boolean;
  loadedAt: string;
  error: string | null;
}

export interface AiKeyOverview {
  providers: AiKeyProviderState[];
  instances: AiKeyInstanceState[];
  keyVersion: number;
}

export interface AiKeyCheckResult {
  isSuccess: boolean;
  message: string;
  checkedAt: string;
}
