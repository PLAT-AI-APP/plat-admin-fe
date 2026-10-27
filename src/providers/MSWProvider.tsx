"use client";

import { useEffect, useState, type ReactNode } from "react";

/* 운영 빌드에는 프로파일 값과 상관없이 목업을 싣지 않는다 — 빌드 환경 변수 실수로 가짜 응답이 콘솔에 섞이지 않게. */
const isMockingEnabled =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
let workerReadyPromise: Promise<void> | null = null;

const startWorker = async () => {
  if (!workerReadyPromise) {
    workerReadyPromise = import("@/mocks/browser").then(async ({ worker }) => {
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });
    });
  }

  return workerReadyPromise;
};

interface MSWProviderProps {
  children: ReactNode;
}

const MSWProvider = ({ children }: MSWProviderProps) => {
  const [isReady, setIsReady] = useState(!isMockingEnabled);

  useEffect(() => {
    if (!isMockingEnabled) return;

    startWorker()
      .catch((error) => {
        console.error("[MSW] failed to start worker:", error);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  if (!isReady) return null;

  return <>{children}</>;
};

export default MSWProvider;
