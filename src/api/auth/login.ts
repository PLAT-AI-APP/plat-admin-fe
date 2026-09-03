import { useMutation } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { LoginSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import type { AppError } from "@/type/api";
import type { LoginResponse } from "@/type/auth";

/**
 * 로그인.
 *
 * 서버는 Spring Security 필터가 본문을 읽으므로 필드 이름이 `username`이다.
 * 값은 이메일이지만 이름은 서버 계약을 그대로 따른다 — 화면 쪽 스키마만
 * `email`로 두고 여기서 한 번 맞춘다.
 */
export const login = async (values: LoginSchema) => {
  const response = await liveAxios.post<LoginResponse>("/admin/auth/login", {
    username: values.email,
    password: values.password,
  });

  return response.data;
};

/**
 * 로그인 뮤테이션.
 *
 * 실패 문구는 서버가 정한다(잘못된 비밀번호 · 비활성 · 잠김). 화면에서 다시
 * 분기하면 서버가 사유를 하나 더 만들 때마다 화면도 고쳐야 한다.
 */
export const useLoginMutation = () => {
  const setSession = useAdminStore((state) => state.setSession);

  return useMutation<LoginResponse, AppError, LoginSchema>({
    mutationFn: login,
    onSuccess: ({ accessToken, refreshToken, admin, mustChangePassword }) =>
      setSession({ accessToken, refreshToken, admin, mustChangePassword }),
  });
};
