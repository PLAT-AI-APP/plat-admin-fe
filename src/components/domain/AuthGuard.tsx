"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LOGIN_PATH } from "@/api";
import { useAdminStore } from "@/store/useAdminStore";
import Spinner from "@/components/ui/Spinner";
import PasswordChangeModal from "./PasswordChangeModal";

/**
 * 로그인하지 않은 접근을 막는다.
 *
 * **화면을 감추는 것은 실수를 줄이는 장치일 뿐 막는 수단이 아니다.**
 * 실제로 막는 것은 서버다. 다만 세션이 없는 상태로 화면을 그리면 모든 조회가
 * 401로 깨지므로, 그 전에 로그인으로 보낸다.
 */
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const admin = useAdminStore((state) => state.admin);
  const isHydrated = useAdminStore((state) => state.isHydrated);
  const mustChangePassword = useAdminStore((state) => state.mustChangePassword);
  const hydrate = useAdminStore((state) => state.hydrate);

  // localStorage는 클라이언트에서만 읽을 수 있다.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || admin) return;

    // 로그인 후 원래 보려던 화면으로 되돌아갈 수 있게 경로를 실어 보낸다.
    router.replace(`${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`);
  }, [admin, isHydrated, pathname, router]);

  /*
    복구 전에는 "로그인 안 됨"과 구분할 수 없다. 그냥 그리면 새로고침마다
    로그인 화면이 한 번 번쩍이고, 그 사이 조회가 401로 날아간다.
  */
  if (!isHydrated || !admin) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-bg-base">
        <Spinner size={22} className="text-brand" />
      </div>
    );
  }

  return (
    <>
      {children}

      {/* 임시 비밀번호를 쓰는 계정은 바꾸기 전까지 아무것도 할 수 없다. */}
      <PasswordChangeModal
        isOpen={mustChangePassword}
        onClose={() => {}}
        isForced
      />
    </>
  );
};

export default AuthGuard;
