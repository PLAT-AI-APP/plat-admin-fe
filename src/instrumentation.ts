import * as Sentry from "@sentry/nextjs";
import { isMonitoringEnabled, sentryOptions } from "@/lib/monitoring";

/** 서버(Node·Edge) 쪽 오류 수집. DSN 이 없으면 켜지 않는다. */
export function register() {
  if (!isMonitoringEnabled) return;
  Sentry.init(sentryOptions);
}

export const onRequestError: typeof Sentry.captureRequestError = (...args) => {
  if (!isMonitoringEnabled) return;
  Sentry.captureRequestError(...args);
};
