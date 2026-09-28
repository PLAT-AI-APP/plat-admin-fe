import * as Sentry from "@sentry/nextjs";

/**
 * 오류 수집(Sentry). DSN 이 없으면 아무것도 하지 않는다 — DSN 은 운영 준비 때 환경 변수로 넣는다.
 *
 * 대화 내용·개인정보가 섞이지 않게 기본 PII 수집을 끄고, 요청 본문은 싣지 않는다.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

export const isMonitoringEnabled = SENTRY_DSN !== "";

export const sentryOptions = {
  dsn: SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0,
};

export const reportError = (
  error: unknown,
  extra?: Record<string, unknown>,
): void => {
  if (!isMonitoringEnabled) return;
  Sentry.captureException(error, extra ? { extra } : undefined);
};
