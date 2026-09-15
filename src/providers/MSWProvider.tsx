"use client";

import { useEffect, useState, type ReactNode } from "react";

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
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
