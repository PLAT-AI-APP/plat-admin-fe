"use client";

import { useEffect, useRef, useState } from "react";

/** 자동 새로고침 주기 선택지. 0은 끔이다. */
export const AUTO_REFRESH_SECONDS = [0, 5, 10, 30, 60] as const;

export type AutoRefreshSeconds = (typeof AUTO_REFRESH_SECONDS)[number];

export const AUTO_REFRESH_LABEL: Record<AutoRefreshSeconds, string> = {
  0: "자동 새로고침 끔",
  5: "5초마다",
  10: "10초마다",
  30: "30초마다",
  60: "1분마다",
};

/**
 * 주기마다 `onTick`을 부르고 다음 호출까지 남은 초를 돌려준다.
 *
 * 탭이 가려져 있으면 멈춘다. 열어 두기만 한 탭이 밤새 5초마다 서버를 찌르면
 * 상태를 보는 화면이 그 자체로 부하가 된다. 다시 돌아오면 즉시 한 번 부르고
 * 이어 간다 — 가려진 동안의 값은 어차피 낡았다.
 */
export const useAutoRefresh = (
  intervalSeconds: AutoRefreshSeconds,
  onTick: () => void,
) => {
  /**
   * 주기와 남은 초를 한 덩어리로 들고 있다가, 주기가 바뀐 렌더에서 바로 맞춘다.
   * effect 안에서 되돌리면 한 프레임 동안 옛 카운트다운이 보인다.
   */
  const [countdown, setCountdown] = useState({
    interval: intervalSeconds as number,
    left: intervalSeconds as number,
  });
  // 매 렌더마다 바뀌는 콜백 때문에 타이머가 다시 시작되면 영원히 발동하지 않는다.
  const tickRef = useRef(onTick);

  if (countdown.interval !== intervalSeconds) {
    setCountdown({ interval: intervalSeconds, left: intervalSeconds });
  }

  useEffect(() => {
    tickRef.current = onTick;
  });

  useEffect(() => {
    if (intervalSeconds === 0) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;

      setCountdown((previous) => {
        if (previous.left > 1) {
          return { ...previous, left: previous.left - 1 };
        }

        tickRef.current();

        return { interval: intervalSeconds, left: intervalSeconds };
      });
    }, 1_000);

    const handleVisibility = () => {
      if (document.hidden) return;

      tickRef.current();
      setCountdown({ interval: intervalSeconds, left: intervalSeconds });
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalSeconds]);

  return { secondsLeft: intervalSeconds === 0 ? 0 : countdown.left };
};
