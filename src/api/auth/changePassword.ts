import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { showAppToast } from "@/lib/toast";
import type { PasswordChangeSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type { TokenResponse } from "@/type/auth";

export const changePassword = async (values: PasswordChangeSchema) => {
  const response = await liveAxios.post<TokenResponse>("/admin/auth/password", {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
  });

  return response.data;
};

/**
 * 비밀번호 변경. 성공하면 임시 비밀번호 강제 변경 상태가 풀린다.
 *
 * 임시 비밀번호를 쓰는 계정은 서버에서 `PASSWORD_CHANGE_REQUIRED` 권한 하나만
 * 받아 `/admin/auth/**` 밖이 전부 막힌다. 여기를 통과해야 콘솔이 열린다.
 *
 * **서버가 이 계정의 세션을 전부 끊고 새 토큰 한 쌍을 내준다.** 비밀번호를 바꾸는
 * 이유의 절반은 "남이 알고 있을지도 모른다"라서, 다른 기기에 열려 있던 세션이
 * 남아 있으면 바꾼 의미가 없다. 응답으로 온 토큰으로 갈아 끼우지 않으면 방금 바꾼
 * 본인도 함께 쫓겨난다.
 */
export const usePasswordChangeMutation = () => {
  const queryClient = useQueryClient();
  const setTokens = useAdminStore((state) => state.setTokens);
  const resolvePasswordChange = useAdminStore(
    (state) => state.resolvePasswordChange,
  );

  return useMutation<TokenResponse, AppError, PasswordChangeSchema>({
    mutationFn: changePassword,
    onSuccess: (tokens) => {
      /* 토큰을 먼저 갈아 끼운다 — 아래 재조회가 이미 폐기된 토큰으로 나가면 안 된다. */
      setTokens(tokens);
      showAppToast("success", "비밀번호를 변경했습니다. 다른 기기의 로그인은 해제됩니다.");
      resolvePasswordChange();
      /*
        잠겨 있는 동안 뒤에서 돌던 조회는 전부 403으로 끝났고 그 실패가 캐시에
        남아 있다. 지우지 않으면 비밀번호를 바꿔 열린 콘솔이 여전히 오류 화면으로
        보인다. 위에서 갈아 끼운 새 토큰이 바로 전체 권한을 받으므로 다시 부르면 된다.
      */
      queryClient.invalidateQueries();
    },
  });
};
