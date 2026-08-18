"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/api/auth/login";
import { ShieldCheck } from "@/icons";
import { loginSchema, type LoginSchema } from "@/schema/auth.schema";
import { useAdminStore } from "@/store/useAdminStore";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import SeedAccountHint from "./SeedAccountHint";

/** 로그인 후 돌아갈 경로. 콘솔 밖이나 절대 URL로는 보내지 않는다. */
const resolveRedirect = (redirect: string | null) =>
  redirect && redirect.startsWith("/") && !redirect.startsWith("/login")
    ? redirect
    : "/";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const admin = useAdminStore((state) => state.admin);
  const hydrate = useAdminStore((state) => state.hydrate);

  const redirectTo = resolveRedirect(searchParams.get("redirect"));
  // 인터셉터가 세션을 지우고 보낸 경우에만 만료 안내를 띄운다.
  const isExpired = searchParams.get("reason") === "expired";

  const { mutate: submitLogin, isPending, error } = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 이미 로그인한 상태로 이 화면에 오면 콘솔로 되돌린다.
  useEffect(() => {
    if (admin) router.replace(redirectTo);
  }, [admin, redirectTo, router]);

  const submit = handleSubmit((values) =>
    submitLogin(values, { onSuccess: () => router.replace(redirectTo) }),
  );

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-[14px] bg-brand text-font-4">
          <ShieldCheck size={22} />
        </span>

        <div>
          <h1 className="text-[20px] font-bold text-font-0">PLAT 관리자</h1>
          <p className="mt-1 text-[13px] text-font-2">
            운영 계정으로 로그인해 주세요.
          </p>
        </div>
      </div>

      {isExpired && (
        <Alert tone="warning">
          세션이 만료되어 로그아웃되었습니다. 다시 로그인해 주세요.
        </Alert>
      )}

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-1">
          <FormField
            label="이메일"
            htmlFor="login-email"
            error={errors.email?.message}
          >
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="name@plat.so"
              hasError={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="비밀번호"
            htmlFor="login-password"
            error={errors.password?.message}
          >
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              hasError={Boolean(errors.password)}
              {...register("password")}
            />
          </FormField>

          {/*
            실패 사유는 서버 문구를 그대로 쓴다. 잠김 · 비활성처럼 운영자가
            다음에 무엇을 해야 하는지가 문구에 들어 있다.
          */}
          {error && (
            <Alert tone="danger" className="mt-1">
              {error.message}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            className="mt-3"
          >
            로그인
          </Button>
        </form>
      </Card>

      <SeedAccountHint />
    </div>
  );
};

export default LoginForm;
