/**
 * AI 원가 보고(`GET /ai/costs`).
 *
 * 금액은 원 단위 소수(둘째 자리)다. 매출은 **결제로 산 크레딧 몫만** 그 주문의 실결제액(부가세 제외)으로 환산한 값이고,
 * 가입·이벤트·관리자 지급 크레딧은 매출이 0 이다. 원가는 실패해 크레딧을 돌려준 턴도 포함한다.
 */
export interface AiCost {
  /** 기간 안 대화 턴(실패 포함) */
  turns: number;
  /** 크레딧이 확정된 턴 */
  settledTurns: number;
  /** 확정됐지만 원가를 모르는 턴(단가 없는 모델 · 토큰 수 못 받음) */
  unpricedTurns: number;
  inputTokens: number;
  outputTokens: number;
  costKrw: number;
  /** 대화에 쓴 크레딧 전부 */
  credits: number;
  /** 그중 결제로 산 크레딧 */
  paidCredits: number;
  netRevenueKrw: number;
  grossProfitKrw: number;
  /** 이익 ÷ 매출. 매출이 없으면 null */
  marginRate: number | null;
  /** 크레딧 1개를 쓰는 데 든 원가. 쓴 크레딧이 없으면 null */
  costPerCredit: number | null;
}

export interface AiCostReport {
  /** 한국 날짜, 양 끝 포함 */
  from: string;
  to: string;
  total: AiCost;
  daily: { date: string; cost: AiCost }[];
  /** model 이 null 이면 모델을 기록하기 전 정산 */
  models: { model: string | null; cost: AiCost }[];
  /** 원가가 큰 순 20명. 닉네임·상태는 지금 값 */
  topUsers: {
    userId: string;
    nickname: string | null;
    status: string | null;
    cost: AiCost;
  }[];
}
