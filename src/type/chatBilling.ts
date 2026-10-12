/**
 * 채팅 요금(노트) 과금 정책 한 버전. 고치지 않고 새 버전을 쌓는다.
 *
 * 노트 = max(1, ceil(청구원가 × k ÷ 노트 기준가)), k = 1 ÷ (1 − 제작자몫 − 수수료·세금 − 목표이익률).
 */
export interface ChatBillingPolicy {
  policyId: string;
  /** 노트 기준가(원, 기본 상품 단가) */
  noteBasePrice: number;
  creatorShareBps: number;
  feeBps: number;
  targetMarginBps: number;
  /** 잠금용 입력 토큰 추정 안전계수(만분율, 13000 = 1.3배) */
  inputSafetyBps: number;
  /** 이 정책의 판매 배수 k */
  priceMultiplier: number;
  /** 손익분기 배수. 모델별 k 덮어쓰기의 하한 */
  breakEvenMultiplier: number;
  effectiveFrom: string;
  changedByName?: string | null;
  memo?: string | null;
}

export type ChatBillingPolicyValues = Pick<
  ChatBillingPolicy,
  "noteBasePrice" | "creatorShareBps" | "feeBps" | "targetMarginBps" | "inputSafetyBps"
>;

/**
 * 응답 형식 프리셋(채팅형·소설형 등). 한 턴의 출력 상한·최근 대화 수·분량·문체를 정한다.
 * 요금은 쓴 토큰으로 매기므로 형식이 곧 그 턴의 가격대다.
 */
export interface ResponseFormat {
  responseFormatId: string;
  /** 시나리오 설정·정산이 가리키는 불변 식별자 */
  code: string;
  name: string;
  description: string;
  maxOutputTokens: number;
  recentMessageCount: number;
  /** 원하는 분량(글자 수). 비우면 분량을 말하지 않는다. */
  targetChars: number | null;
  /** 형식 프롬프트 — 문체·호흡·블록 구성. 시스템 프롬프트 맨 끝에 붙는다. */
  styleDirective: string;
  /** 매 사용자 턴 끝에 붙는 짧은 리마인더. 없으면 분량만 말한다. */
  turnReminder: string | null;
  /** 화면의 "약 N노트" 계산용 기준 입력·출력 토큰 */
  refInputTokens: number;
  refOutputTokens: number;
  /** 최저 기준 턴(입력·출력 토큰). 이 턴을 모델 단가로 매긴 노트가 그 모델의 최저 노트다. */
  minInputTokens: number;
  minOutputTokens: number;
  enabled: boolean;
  sortOrder: number;
}

export type ResponseFormatValues = Omit<ResponseFormat, "responseFormatId">;
