"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Tabs, { type TabItem } from "@/components/ui/Tabs";

interface DetailSectionTabsProps {
  /** `value`는 이동할 섹션의 DOM id다. */
  items: TabItem[];
  className?: string;
}

/** 탭을 누른 뒤 부드러운 스크롤이 끝날 때까지 스크롤 감시를 멈추는 시간 */
const CLICK_LOCK_MS = 800;

/**
 * 상세 화면의 섹션 이동 탭.
 *
 * 탭마다 내용을 갈아 끼우지 않고 **모든 섹션을 한 페이지에 쌓은 채 해당 위치로
 * 스크롤한다.** 검수는 "이 캐릭터의 제작자는 누구고, 어느 세계관에 나오나"처럼
 * 섹션을 넘나들며 대조하는 일이라, 탭 뒤에 숨기면 매번 눌러 가며 기억해야 한다.
 *
 * 탭 바는 스크롤 영역 위에 붙어 있어 긴 페이지 중간에서도 바로 옮길 수 있고,
 * 스크롤 위치에 따라 지금 보고 있는 섹션의 탭에 밑줄이 따라간다.
 */
const DetailSectionTabs = ({ items, className }: DetailSectionTabsProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const lockedUntilRef = useRef(0);
  const [active, setActive] = useState(items[0]?.value ?? "");

  // 섹션 구성이 바뀌어도 감시 대상만 갈아 끼우면 된다.
  const ids = items.map((item) => item.value).join("|");

  useEffect(() => {
    const sectionIds = ids.split("|").filter(Boolean);

    const sync = (event?: Event) => {
      if (Date.now() < lockedUntilRef.current) return;

      const bar = barRef.current;
      if (!bar) return;

      const barBottom = bar.getBoundingClientRect().bottom;
      const scroller = event?.target;

      // 끝까지 내렸는데 마지막 섹션이 짧아 위로 못 올라오면 마지막 탭을 켠다.
      if (
        scroller instanceof HTMLElement &&
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
      ) {
        setActive(sectionIds[sectionIds.length - 1]);

        return;
      }

      // 탭 바 바로 아래를 지난 섹션 중 가장 마지막 것이 지금 보고 있는 섹션이다.
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;

        if (top !== undefined && top - barBottom <= 24) current = id;
      }

      setActive(current);
    };

    // 스크롤은 창이 아니라 레이아웃의 `main`에서 일어난다. 캡처로 받아 컨테이너를 몰라도 되게 한다.
    document.addEventListener("scroll", sync, { capture: true, passive: true });

    return () =>
      document.removeEventListener("scroll", sync, { capture: true });
  }, [ids]);

  const handleChange = (id: string) => {
    lockedUntilRef.current = Date.now() + CLICK_LOCK_MS;
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={barRef}
      // 섹션 카드가 뒤로 지나가므로 배경은 카드가 아니라 워크스페이스 색이다.
      className={cn("sticky top-0 z-10 bg-bg-base py-3", className)}
    >
      <Tabs items={items} value={active} onChange={handleChange} />
    </div>
  );
};

export default DetailSectionTabs;
