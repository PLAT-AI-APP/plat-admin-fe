"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { handleUnauthorized, LOGIN_PATH } from "@/api";
import { useSyncMyProfile } from "@/api/auth/getMe";
import { readJwtExpiresAt } from "@/lib/jwt";
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
  const refreshToken = useAdminStore((state) => state.refreshToken);
  const isSessionExpired = useAdminStore((state) => state.isSessionExpired);
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

  /*
    세션이 만료되는 순간 로그인 화면으로 보낸다.

    콘솔은 한번 열어 두면 하루 종일 그대로 켜져 있다. 다음 클릭까지 기다리면
    자리를 뜬 사이 만료된 화면이 몇 시간이고 열려 있고, 돌아온 사람은 아무
    버튼이나 눌러 본 뒤에야 로그아웃된 것을 안다. 그래서 만료 시각에 맞춰
    타이머를 걸고, 화면이 다시 보이는 순간에도 한 번 확인한다 — 노트북이 자는
    동안 타이머는 제때 깨어나지 않는다.
  */
  useEffect(() => {
    const expiresAt = readJwtExpiresAt(refreshToken);

    if (expiresAt === null) return;

    const expire = () => {
      if (Date.now() < expiresAt * 1000) return;

      handleUnauthorized();
    };

    const timer = window.setTimeout(expire, Math.max(expiresAt * 1000 - Date.now(), 0));

    document.addEventListener("visibilitychange", expire);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", expire);
    };
  }, [refreshToken]);

  useEffect(() => {
    if (!isHydrated || admin) return;

    /*
      로그인 후 원래 보려던 화면으로 되돌아갈 수 있게 경로를 실어 보낸다.
      만료로 끊긴 경우에는 사유도 함께 실어 로그인 화면이 안내 문구를 띄운다.
    */
    const reason = isSessionExpired ? "&reason=expired" : "";

    router.replace(
      `${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}${reason}`,
    );
  }, [admin, isHydrated, isSessionExpired, pathname, router]);

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
