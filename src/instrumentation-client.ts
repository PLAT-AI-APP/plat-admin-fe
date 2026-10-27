import * as Sentry from "@sentry/nextjs";
import { isMonitoringEnabled, sentryOptions } from "@/lib/monitoring";

/** 브라우저 쪽 오류 수집. DSN 이 없으면 켜지 않는다. */
if (isMonitoringEnabled) {
  Sentry.init(sentryOptions);
}
