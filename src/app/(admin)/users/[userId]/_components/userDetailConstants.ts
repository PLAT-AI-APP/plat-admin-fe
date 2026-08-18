import type { TabItem } from "@/components/ui/Tabs";

/**
 * 유저 상세 안의 목록은 한 화면에 여러 탭이 겹치므로 목록 화면(20건)보다 짧게 끊는다.
 */
export const USER_DETAIL_PAGE_SIZE = 10;

export type UserDetailTab =
  | "ACCOUNT"
  | "CHARACTER"
  | "COMMENT"
  | "BILLING"
  | "REPORT";

export const USER_DETAIL_TABS: TabItem<UserDetailTab>[] = [
  { label: "계정 정보", value: "ACCOUNT" },
  { label: "보유 캐릭터", value: "CHARACTER" },
  { label: "작성 댓글", value: "COMMENT" },
  { label: "결제 · 크레딧", value: "BILLING" },
  { label: "신고 이력", value: "REPORT" },
];
