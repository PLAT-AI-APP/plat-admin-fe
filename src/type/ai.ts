/**
 * 모델 제공사.
 *
 * 서버가 실제로 클라이언트를 세울 수 있는 곳만 있다. 목록을 늘리는 것은 "그 회사 모델을 부를 수
 * 있다"는 말이라, 실제로 부를 수 있게 된 다음에 서버 `AiProvider` 와 함께 늘린다.
 */
export type AiProvider = "ANTHROPIC" | "OPENAI" | "GOOGLE";
export type AiModelStatus = "AVAILABLE" | "DEPRECATED" | "UNAVAILABLE";

/**
 * 모델이 맡는 역할. 역할 하나가 서비스 기능 하나와 짝을 이룬다.
 *
 * **역할 하나에는 모델 하나가 선다.** 역할이 비면 그 기능이 통째로 멈추므로 해제는 없고
 * 다른 모델로 옮기는 것만 가능하다. 옮기면 이전 모델의 역할이 자동으로 풀린다.
 *
 * **반대 방향은 막지 않는다** — 한 모델이 여러 역할을 함께 맡을 수 있다. 서버도 역할 쪽에만
 * 유일 제약을 걸어 두었고 모델 쪽에는 걸지 않았다.
 *
 * - `CHAT_DEFAULT` 모델을 따로 지정하지 않은 대화
 * - `UNIVERSE_REVIEW` 세계관 등록 시 자동으로 도는 심사 AI
 * - `MEMORY_SUMMARY` 대화 기록을 장기기억으로 압축하는 요약
 */
export type AiModelRole = "CHAT_DEFAULT" | "UNIVERSE_REVIEW" | "MEMORY_SUMMARY";

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
  /** 캐시에서 읽은 입력 1M 토큰당 원. 보통 입력의 1/10. */
  cacheReadPricePerMillion: number;
  /** 캐시에 쓴 입력 1M 토큰당 원. Anthropic 만 입력의 1.25배, 나머지는 입력과 같다. */
  cacheWritePricePerMillion: number;
}

/** 모델 테스트 호출 결과 */
export interface AiModelPingResult {
  model: string;
  isSuccess: boolean;
  latencyMs: number;
  message: string;
  pingedAt: string;
}

/** 응답 형식 하나의 기준 대화 한 턴 노트. */
export interface FormatNoteEstimate {
  responseFormat: string;
  responseFormatName: string;
  estimatedNotes: number;
}

/** 운영에서 사용 중인 모델 설정 */
export interface AiModel {
  modelId: number;
  model: string;
  displayName: string;
  provider: AiProvider;
  isEnabled: boolean;
  /**
   * 이 모델이 맡고 있는 역할. 대부분의 모델은 비어 있고, 한 모델이 여러 역할을 겸할 수 있다.
   *
   * 역할을 하나라도 가진 모델은 사용 중지할 수 없다 — 중지하면 그 역할이 갈 곳을 잃는다.
   */
  roles: AiModelRole[];
  /**
   * 판매 배수 k 덮어쓰기(만분율, 19600 = 1.96배). `null`이면 과금 정책의 k를 쓴다.
   *
   * 채팅 요금은 쓴 토큰으로 매긴다: 노트 = max(1, ceil(청구원가 × k ÷ 노트 기준가)).
   */
  priceMultiplierBps: number | null;
  /** 이 모델에 실제로 적용되는 k(덮어쓰기가 없으면 과금 정책의 k). */
  effectivePriceMultiplier: number;
  /** 청구용 평균 캐시 비율(만분율, 7500 = 75%). 입력을 이 비율로 캐시 읽기 단가와 섞어 매긴다. */
  cacheRatioBps: number;
  /** 응답 형식별 기준 대화 한 턴의 예상 노트. 단가표와 맞춰 보는 미리보기다. */
  formatNoteEstimates: FormatNoteEstimate[];
  /** 이 모델의 출력 상한. 응답 형식의 출력 상한(+생각 몫)이 이 선을 넘지 못한다. */
  maxOutputTokens: number;
  temperature: number;
  memo: string;
  /**
   * 1M 토큰당 원. 제공사가 가격을 바꾸면 여기서 고친다. 대화는 시작할 때 단가를 복사해 두므로
   * 바꾼 뒤 시작한 대화부터 새 단가로 원가가 적힌다.
   */
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion: number;
  cacheWritePricePerMillion: number;
  /** 한 번도 고친 적 없는 모델은 서버가 `null`을 준다. */
  updatedAt: string | null;
}

/**
 * 시스템 프롬프트의 종류.
 *
 * 어떤 프롬프트가 존재하는지는 서버의 `SystemPromptKey` enum이 정한다.
 * 여기 적는 것은 서버가 내려주는 값을 좁혀 두는 것일 뿐, 목록의 출처가 아니다.
 */
export type SystemPromptKey =
  | "SAFETY_FILTER"
  | "SAFETY_FILTER_ADULT"
  | "UNIVERSE_CHAT"
  | "UNIVERSE_REVIEW"
  | "RECOMMENDATION";

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
