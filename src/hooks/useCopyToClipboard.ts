import { useCallback, useState } from "react";
import { showAppToast } from "@/lib/toast";

interface UseCopyToClipboardOptions {
  /**
   * 복사에 실패했을 때 할 일. 주지 않으면 값을 직접 선택하라는 경고 토스트를 띄운다.
   *
   * 화면에 값이 그대로 보이는 자리는 직접 긁어 가면 되지만, 화면에 없는 값을
   * 만들어 복사하는 자리(서버 스냅샷 JSON 등)는 그 안내가 맞지 않아 바꿔 끼운다.
   */
  onError?: (error: unknown) => void;
}

/**
 * 값을 클립보드에 복사하고 결과를 토스트로 알린다.
 *
 * 거래번호 · 임시 비밀번호처럼 **손으로 옮겨 적으면 틀리는 값**을 복사하는 버튼이
 * 화면마다 같은 try/catch를 들고 있었다. 클립보드 권한이 없는 환경(비보안 출처,
 * 권한 거부)에서는 `writeText`가 거절되므로 실패 안내를 빠뜨리지 않게 한곳에 둔다.
 *
 * `isCopied`는 한 번 성공하면 `reset`을 부를 때까지 유지된다. 모달처럼 닫았다
 * 다시 여는 자리에서 "복사됨"이 남지 않도록 닫을 때 `reset`을 부른다.
 *
 * ```ts
 * const { copy, isCopied, reset } = useCopyToClipboard();
 * copy(result.temporaryPassword, "임시 비밀번호를 복사했습니다.");
 * ```
 */
export const useCopyToClipboard = ({
  onError,
}: UseCopyToClipboardOptions = {}) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(
    async (text: string, successMessage: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        showAppToast("success", successMessage);

        return true;
      } catch (error) {
        if (onError) {
          onError(error);
        } else {
          // 클립보드 권한이 없는 환경에서는 직접 선택해 복사해야 한다.
          showAppToast(
            "warning",
            "복사에 실패했습니다. 값을 직접 선택해 주세요.",
          );
        }

        return false;
      }
    },
    [onError],
  );

  const reset = useCallback(() => setIsCopied(false), []);

  return { copy, isCopied, reset };
};
