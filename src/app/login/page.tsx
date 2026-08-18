import { Suspense } from "react";
import LoginForm from "./_components/LoginForm";

/**
 * 관리자 로그인.
 *
 * `(admin)` 그룹 밖에 두어 사이드바 · 헤더가 붙지 않는다.
 * 로그인 화면에서 메뉴가 보이면 들어가지도 못한 기능 목록을 먼저 보게 된다.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-base px-6 py-10">
      {/* redirect · reason 쿼리를 읽으므로 Suspense 경계가 필요하다. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
