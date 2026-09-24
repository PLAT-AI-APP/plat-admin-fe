import type {
  EarningAccountDetail,
  EarningAccountRow,
  EarningAccountStatus,
  EarningAccrualRow,
  EarningContribution,
  EarningHistory,
  EarningHistoryTarget,
  EarningActorType,
  EarningLedgerRow,
  EarningLedgerType,
  EarningPolicy,
  EarningReconciliation,
  EarningReconciliationCheck,
  Redemption,
  RewardProduct,
  RewardRedemptionStatus,
  RewardType,
} from "@/type/earning";

/*
 * 서버 응답 그대로의 모양. 없는 값은 null 로 오고 화면은 undefined 로 다룬다.
 * 적립 금액·대사 값은 BigDecimal 이라 JSON 숫자로 온다.
 */

export interface EarningAccountListResponse {
  accountId: string;
  userId: string;
  nickname: string | null;
  status: EarningAccountStatus;
  available: number;
  accrued30d: number;
  paidChatters30d: number;
  totalAccrued: number;
  totalRedeemed: number;
  lastAccruedAt: string | null;
}

export interface EarningAccountDetailResponse extends Omit<EarningAccountDetail, "nickname"> {
  nickname: string | null;
  carryFraction: number;
}

export interface EarningContributionResponse {
  userId: string;
  nickname: string | null;
  joinedAt: string | null;
  paidNotes: number;
  amount: number;
}

export interface EarningLedgerAdminResponse {
  ledgerId: string;
  type: EarningLedgerType;
  amount: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  productName: string | null;
  reasonCode: string | null;
  memo: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface EarningAccrualAdminResponse {
  accrualId: string;
  accrualDate: string;
  universeId: string;
  universeTitle: string | null;
  chatterUserId: string;
  chatterNickname: string | null;
  paidNotes: number;
  turnCount: number;
  noteUnitPrice: number;
  shareBps: number;
  amount: number;
}

export interface EarningHistoryResponse {
  historyId: string;
  targetType: EarningHistoryTarget;
  targetId: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: EarningActorType;
  actorName: string | null;
  reasonCode: string;
  memo: string | null;
  createdAt: string;
}

export interface RedemptionAdminResponse {
  redemptionId: string;
  accountId: string;
  userId: string;
  nickname: string | null;
  accountStatus: EarningAccountStatus;
  productName: string;
  type: RewardType;
  pointAmount: number;
  noteAmount: number | null;
  status: RewardRedemptionStatus;
  recipientPhone: string | null;
  requestedAt: string;
  processedAt: string | null;
  processedByName: string | null;
  rejectReason: string | null;
  memo: string | null;
}

export interface EarningPolicyResponse {
  policyId: string;
  shareBps: number;
  noteUnitPrice: number;
  minRedeemAmount: number;
  validYears: number;
  effectiveFrom: string;
  changedByName: string | null;
  memo: string | null;
}

export interface RewardProductAdminResponse {
  productId: string;
  name: string;
  imageFileId: string | null;
  imageUrl: string | null;
  pointPrice: number;
  active: boolean;
  sortOrder: number;
}

export interface EarningReconciliationResponse {
  runDate: string;
  checkCode: EarningReconciliationCheck;
  expected: number;
  actual: number;
  matched: boolean;
}

const opt = <T>(value: T | null): T | undefined => value ?? undefined;

export const toEarningAccountRow = (row: EarningAccountListResponse): EarningAccountRow => ({
  ...row,
  nickname: opt(row.nickname),
  lastAccruedAt: opt(row.lastAccruedAt),
});

export const toEarningAccountDetail = (
  row: EarningAccountDetailResponse,
): EarningAccountDetail => ({
  accountId: row.accountId,
  userId: row.userId,
  nickname: opt(row.nickname),
  status: row.status,
  available: row.available,
  accrued30d: row.accrued30d,
  totalAccrued: row.totalAccrued,
  totalRedeemed: row.totalRedeemed,
});

export const toEarningContribution = (
  row: EarningContributionResponse,
): EarningContribution => ({
  ...row,
  nickname: opt(row.nickname),
  joinedAt: opt(row.joinedAt),
});

export const toEarningLedgerRow = (row: EarningLedgerAdminResponse): EarningLedgerRow => ({
  ...row,
  productName: opt(row.productName),
  reasonCode: opt(row.reasonCode),
  memo: opt(row.memo),
  actorName: opt(row.actorName),
});

export const toEarningAccrualRow = (row: EarningAccrualAdminResponse): EarningAccrualRow => ({
  ...row,
  universeTitle: opt(row.universeTitle),
  chatterNickname: opt(row.chatterNickname),
});

export const toEarningHistory = (row: EarningHistoryResponse): EarningHistory => ({
  ...row,
  fromStatus: opt(row.fromStatus),
  actorName: opt(row.actorName),
  memo: opt(row.memo),
});

export const toRedemption = (row: RedemptionAdminResponse): Redemption => ({
  ...row,
  nickname: opt(row.nickname),
  noteAmount: opt(row.noteAmount),
  recipientPhone: opt(row.recipientPhone),
  processedAt: opt(row.processedAt),
  processedByName: opt(row.processedByName),
  rejectReason: opt(row.rejectReason),
  memo: opt(row.memo),
});

export const toEarningPolicy = (row: EarningPolicyResponse): EarningPolicy => ({
  ...row,
  changedByName: opt(row.changedByName),
  memo: opt(row.memo),
});

export const toRewardProduct = (row: RewardProductAdminResponse): RewardProduct => ({
  ...row,
  imageFileId: opt(row.imageFileId),
  imageUrl: opt(row.imageUrl),
});

export const toEarningReconciliation = (
  row: EarningReconciliationResponse,
): EarningReconciliation => row;
