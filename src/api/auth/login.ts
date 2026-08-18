import { useMutation } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { LoginSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type { LoginResponse } from "@/type/auth";

export const login = async (values: LoginSchema) => {
  const response = await adminAxios.post<LoginResponse>(
    "/admin/auth/login",
    values,
  );

  return response.data;
};

/**
 * 로그인.
 *
 * 실패 문구는 서버가 정한다(잘못된 비밀번호 · 비활성 · 잠김). 화면에서 다시
 * 분기하면 서버가 사유를 하나 더 만들 때마다 화면도 고쳐야 한다.
 */
export const useLoginMutation = () => {
  const setSession = useAdminStore((state) => state.setSession);

  return useMutation<LoginResponse, AppError, LoginSchema>({
    mutationFn: login,
    onSuccess: ({ accessToken, admin, mustChangePassword }) =>
      setSession({ accessToken, admin, mustChangePassword }),
  });
};
