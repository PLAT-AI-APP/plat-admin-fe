/** 수익 조회 캐시 키. 조치 후에는 `all` 로 한꺼번에 무효화한다 — 잔액·원장·이력이 함께 바뀐다. */
export const earningQueryKeys = {
  all: () => ["earning"] as const,
  accountList: (params: object) => ["earning", "accounts", params] as const,
  accountTotals: () => ["earning", "accounts", "totals"] as const,
  account: (accountId: string) => ["earning", "account", accountId] as const,
  accountByUser: (userId: string) => ["earning", "user", userId] as const,
  contributions: (accountId: string) => ["earning", "account", accountId, "contributions"] as const,
  ledgers: (accountId: string, size: number) => ["earning", "account", accountId, "ledgers", size] as const,
  accruals: (accountId: string, size: number) => ["earning", "account", accountId, "accruals", size] as const,
  histories: (accountId: string) => ["earning", "account", accountId, "histories"] as const,
  accountRedemptions: (accountId: string) => ["earning", "account", accountId, "redemptions"] as const,
  redemptionList: (params: object) => ["earning", "redemptions", params] as const,
  redemptionHistories: (redemptionId: string) => ["earning", "redemptions", redemptionId, "histories"] as const,
  pendingRedemptionCount: () => ["earning", "redemptions", "pending-count"] as const,
  policies: () => ["earning", "policies"] as const,
  reconciliations: (days: number) => ["earning", "reconciliations", days] as const,
  rewardProducts: () => ["reward-products"] as const,
};
