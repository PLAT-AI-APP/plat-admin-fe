"use client";

import { useListParams } from "@/hooks/useListParams";
import Tabs from "@/components/ui/Tabs";
import HashtagManager from "./HashtagManager";
import HashtagSuggestManager from "./HashtagSuggestManager";
import {
  HASHTAG_TABS,
  HASHTAG_TAB_DEFAULT_PARAMS,
  type HashtagTab,
} from "./hashtagTabs";

/**
 * 해시태그 화면의 탭.
 *
 * 등록된 태그와 사용자 제안은 **같은 자리에서 오간다** — 제안을 보다가 "그럼 만들자"가 되고,
 * 태그를 만들다 "이미 누가 제안했나"를 확인한다. 메뉴를 나누면 그 왕복이 두 화면 이동이 된다.
 *
 * 탭을 바꾸면 목록 조건(검색어 · 정렬 · 페이지)은 함께 지워진다. 두 표는 정렬 값이 서로 달라
 * 그대로 들고 넘어가면 서버가 모르는 값을 받는다.
 */
const HashtagWorkspace = () => {
  const [params, setParams] = useListParams(HASHTAG_TAB_DEFAULT_PARAMS);
  const tab = params.tab as HashtagTab;

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        items={HASHTAG_TABS}
        value={tab}
        onChange={(next) => setParams({ tab: next })}
      />

      {tab === "suggestions" ? <HashtagSuggestManager /> : <HashtagManager />}
    </div>
  );
};

export default HashtagWorkspace;
