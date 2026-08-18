import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";

export const logout = async () => {
  await adminAxios.post("/admin/auth/logout");
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
