import { useMutation, useQueryClient } from "@tanstack/react-query";
import { liveAxios } from "..";
import { getRefreshToken, useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";

/**
 * 로그아웃.
 *
 * refreshToken을 함께 보낸다. **서버가 이걸 받아야 폐기할 수 있다.** 안 보내면
 * 화면에서만 나간 상태가 되고, 토큰은 남은 수명(12시간) 동안 그대로 살아 있다.
 *
 * accessToken은 서버가 폐기하지 못한다 — 만료를 15분으로 짧게 둔 이유가 이것이다.
 */
export const logout = async () => {
  await liveAxios.post("/admin/auth/logout", {
    refreshToken: getRefreshToken(),
  });
};

/**
 * 로그아웃.
 *
 * 서버 응답이 실패해도 **로컬 세션은 반드시 지운다.** 화면에는 남아 있는데
 * 나갔다고 생각하는 상태가 가장 위험하다. 캐시도 함께 비운다 — 다음 계정이
 * 이전 계정의 목록을 잠깐 보게 되면 권한을 나눈 의미가 없다.
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const clearSession = useAdminStore((state) => state.clearSession);

  return useMutation<void, AppError, void>({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
};
