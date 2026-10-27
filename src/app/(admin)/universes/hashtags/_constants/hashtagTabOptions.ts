import type { TabItem } from "@/components/ui/Tabs";

export type HashtagTab = "tags" | "suggestions";

export const HASHTAG_TABS: TabItem<HashtagTab>[] = [
  { label: "해시태그 관리", value: "tags" },
  { label: "제안", value: "suggestions" },
];

/**
 * 탭 파라미터의 기본값.
 *
 * **두 탭의 목록 조건이 같은 기본값을 공유해야 한다.** `useListParams`는 자기가 아는
 * 키만 주소에 다시 쓰므로, 목록 쪽 기본값에 탭이 빠져 있으면 검색어를 바꾸는 순간
 * 주소에서 탭이 지워져 첫 탭으로 튕긴다.
 */
export const HASHTAG_TAB_DEFAULT_PARAMS = { tab: "tags" };
