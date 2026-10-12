/** 제작자 등급. DUST~GALAXY 는 제작자가 직접 승급하는 사다리, ORIGIN 은 관리자가 지정하는 공식 크리에이터. */
export type CreatorTierCode =
  "NONE" | "DUST" | "COMET" | "PLANET" | "NOVA" | "GALAXY" | "ORIGIN";

export type LadderTierCode = Exclude<CreatorTierCode, "NONE" | "ORIGIN">;

export type CreatorTierChangeKind = "SELF" | "ADMIN" | "ORIGIN";

export interface TierBenefit {
  label: string;
  value: string;
}

/** 사다리 등급 하나. 비율은 bps(1100 = 11%). 등급 자체는 고정이고 조건·혜택만 고친다. */
export interface TierDefinition {
  code: LadderTierCode;
  sortOrder: number;
  minPublicUniverses: number;
  minPaidTurns: number;
  minFollowers: number;
  shareBps: number;
  boostBps: number;
  holdDays: number;
  giftNotes: number;
  benefits: TierBenefit[];
  memberCount: number;
}

export interface CreatorTierBoard {
  tiers: TierDefinition[];
  originMemberCount: number;
  /** 오리진 고정 수익률(bps). 신작 부스트 없음 */
  originShareBps: number;
  /** 등급이 없을 때의 수익률(bps) */
  baseShareBps: number;
}

export interface TierDefinitionChange {
  id: string;
  code: LadderTierCode;
  summary: string;
  adminName: string;
  memo: string;
  createdAt: string;
}

export interface TierDefinitionFormValues {
  minPublicUniverses: number;
  minPaidTurns: number;
  minFollowers: number;
  benefits: TierBenefit[];
  memo: string;
}

export interface CreatorTierChange {
  id: string;
  from: CreatorTierCode;
  to: CreatorTierCode;
  kind: CreatorTierChangeKind;
  effectiveAt: string;
  adminName: string | null;
  memo: string | null;
}

/** 유저 상세 > 크리에이터. 현재 등급·고정, 지표, 등급 이력(최신 먼저). */
export interface UserCreatorTier {
  currentTier: CreatorTierCode;
  locked: boolean;
  publicUniverses: number;
  paidTurns: number;
  followers: number;
  changes: CreatorTierChange[];
}

export interface CreatorTierChangeInput {
  tier: CreatorTierCode;
  locked: boolean;
  memo: string;
}
