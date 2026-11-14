import {
  isMonitoringEnabled,
  loadSentry,
  sentryOptions,
} from "@/lib/monitoring";

/**
 * 브라우저 쪽 오류 수집. DSN 이 없으면 켜지 않는다.
 *
 * SDK 를 첫 화면 JS 에 싣지 않고 따로 받는다. 받는 동안 난 오류는 모아 뒀다가 넘긴다.
 */
if (isMonitoringEnabled) {
  const early: unknown[] = [];
  const onError = (event: ErrorEvent) =>
    early.push(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) =>
    early.push(event.reason);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  void loadSentry().then((sdk) => {
    sdk.init(sentryOptions);
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    early.forEach((error) => sdk.captureException(error));
  });
}
