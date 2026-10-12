import type { CreatorTierCode } from "@/type/creatorTier";

/** 등급 자체(이름·뱃지)는 고정이라 화면 상수로 둔다. 제작자 화면(plat-fe earnings/tier)과 같은 이름·그림이다. */
export const TIER_NAME: Record<CreatorTierCode, string> = {
  NONE: "등급 없음",
  DUST: "더스트",
  COMET: "코멧",
  PLANET: "플래닛",
  NOVA: "노바",
  GALAXY: "갤럭시",
  ORIGIN: "오리진",
};

export const TIER_BADGE: Record<Exclude<CreatorTierCode, "NONE">, string> = {
  DUST: "/images/creator-tier/1-dust.svg",
  COMET: "/images/creator-tier/2-comet.svg",
  PLANET: "/images/creator-tier/3-planet.svg",
  NOVA: "/images/creator-tier/4-nova.svg",
  GALAXY: "/images/creator-tier/5-galaxy.svg",
  ORIGIN: "/images/creator-tier/6-origin.svg",
};

/** 낮은 등급부터. 조정 화면의 선택지 순서이자 올렸는지·내렸는지 판단 기준이다. */
export const TIER_ORDER: CreatorTierCode[] = [
  "NONE",
  "DUST",
  "COMET",
  "PLANET",
  "NOVA",
  "GALAXY",
  "ORIGIN",
];
