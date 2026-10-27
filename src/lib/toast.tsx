import { toast } from "sonner";

export type AppToastType = "success" | "info" | "warning" | "error";

interface ShowAppToastOptions {
  description?: string;
  /**
   * 같은 id 의 toast 는 하나만 뜬다. 여러 요청이 한꺼번에 같은 이유로 실패할 때
   * 같은 안내가 줄지어 쌓이지 않게 한다.
   */
  id?: string;
}

/** 모든 toast 노출 시간 */
const APP_TOAST_DURATION = 3_000;

/**
 * 관리자 전역 toast.
 * 성공/실패 피드백은 반드시 이 함수로만 노출해 문구와 노출 시간을 통일한다.
 */
export const showAppToast = (
  type: AppToastType,
  message: string,
  options: ShowAppToastOptions = {},
) => {
  const { description, id } = options;

  toast[type](message, {
    description,
    id,
    duration: APP_TOAST_DURATION,
  });
};

/** 권한 거부 응답의 코드. 서버 공통 예외 처리기가 붙인다. */
export const FORBIDDEN_CODE = "FORBIDDEN";

export const isForbiddenError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === FORBIDDEN_CODE,
  );

/**
 * 이미 안내한 에러 객체. **같은 실패를 두 번 알리지 않는다.**
 *
 * 뮤테이션 훅의 onError 와 확인 다이얼로그(ConfirmDialogHost)가 같은 실패를 각자 잡으면
 * 같은 문구가 두 번 뜬다. 어느 쪽이 먼저 잡든 한 번만 보이게 여기서 거른다.
 */
const shownErrors = new WeakSet<object>();

/** API 에러 응답을 toast로 노출한다. */
export const showErrorToast = (error: unknown, fallback = "요청에 실패했습니다.") => {
  /* 권한 거부는 요청 인터셉터가 한 곳에서 안내한다(`notifyForbidden`). */
  if (isForbiddenError(error)) return;

  if (error && typeof error === "object") {
    if (shownErrors.has(error)) return;
    shownErrors.add(error);
  }

  const message =
    error instanceof Error && error.message ? error.message : fallback;

  showAppToast("error", message);
};
