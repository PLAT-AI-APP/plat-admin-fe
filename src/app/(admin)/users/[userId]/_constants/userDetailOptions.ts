import type { TabItem } from "@/components/ui/Tabs";
import { IS_MOCKING } from "@/api/baseUri";
import type { PermissionKey } from "@/type/permission";

/**
 * 유저 상세 안의 목록은 한 화면에 여러 탭이 겹치므로 목록 화면(20건)보다 짧게 끊는다.
 */
export const USER_DETAIL_PAGE_SIZE = 10;

export type UserDetailTab =
  | "ACCOUNT"
  | "UNIVERSE"
  | "CHARACTER"
  | "COMMENT"
  | "BILLING"
  | "CREATOR"
  | "EARNING"
  | "REPORT"
  | "QNA"
  | "STATUS_HISTORY"
  | "MEMO";

export const USER_DETAIL_TABS: TabItem<UserDetailTab>[] = [
  { label: "계정 정보", value: "ACCOUNT" },
  { label: "세계관", value: "UNIVERSE" },
  // 캐릭터 목록 API 가 아직 없어 목업 환경에서만 탭을 보인다.
  ...(IS_MOCKING ? [{ label: "캐릭터", value: "CHARACTER" as const }] : []),
  { label: "작성 댓글", value: "COMMENT" },
  { label: "결제 · 노트", value: "BILLING" },
  { label: "크리에이터", value: "CREATOR" },
  { label: "크리에이터 수익", value: "EARNING" },
  { label: "신고 이력", value: "REPORT" },
  { label: "Q&A", value: "QNA" },
  { label: "제재 이력", value: "STATUS_HISTORY" },
  { label: "운영 메모", value: "MEMO" },
];

/**
 * 탭을 보이려면 필요한 권한. 여럿이면 **하나라도** 있으면 보인다.
 *
 * 권한 없는 탭을 남기면 빈 목록이 "이 유저는 기록이 없다"로 읽힌다.
 * 적지 않은 탭은 유저 조회 권한만으로 보인다(탭 안에서 따로 막는 것 포함).
 */
export const USER_DETAIL_TAB_PERMISSIONS: Partial<
  Record<UserDetailTab, PermissionKey[]>
> = {
  UNIVERSE: ["universe:read"],
  COMMENT: ["comment:read"],
  BILLING: ["payment:read", "ledger:read", "creditAdjustment:read"],
  CREATOR: ["earning:read"],
  /* 신고 탭은 패널 안에서 report:read 로 막는다. 제재 이력 · 운영 메모는 유저 조회 권한으로 본다. */
  STATUS_HISTORY: ["user:read"],
  MEMO: ["user:read"],
};
