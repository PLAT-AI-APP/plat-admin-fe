"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LOGIN_PATH } from "@/api";
import { useSyncMyProfile } from "@/api/auth/getMe";
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

  /*
    저장해 둔 세션은 로그인 시점의 사본이다. 그 사이 직책이나 권한이 바뀌었을 수
    있으므로 콘솔을 열 때 서버에 한 번 물어 맞춘다. 토큰이 죽었으면 여기서 401이
    나고 인터셉터가 로그인 화면으로 보낸다.
  */
  useSyncMyProfile();

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

  /*
    임시 비밀번호를 쓰는 계정은 **콘솔을 아예 그리지 않는다.**

    서버가 이 계정에 주는 권한은 PASSWORD_CHANGE_REQUIRED 하나뿐이라
    `/admin/auth/**` 밖은 전부 403이다. 모달만 덮고 뒤에서 화면을 그리면
    사이드바 뱃지부터 목록 조회까지 전부 403으로 끝나고, 비밀번호를 바꾸는
    순간 오류로 뒤덮인 콘솔이 드러난다. 서버가 닫아 둔 것은 화면도 열지 않는다.

    바꾸고 나면 같은 토큰이 곧바로 직책의 전체 권한을 받는다 — 권한은 토큰이
    아니라 요청마다 직책에서 읽기 때문이다. 그래서 다시 로그인할 필요가 없다.
  */
  if (mustChangePassword) {
    return (
      <div className="h-dvh w-full bg-bg-base">
        <PasswordChangeModal isOpen onClose={() => {}} isForced />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
