"use client";

import { usePathname } from "next/navigation";
import { findRoutePermission } from "@/constants/menu";
import { useAdminStore } from "@/store/useAdminStore";
import { hasPermission, type PermissionKey } from "@/type/permission";
import { PermissionDenied } from "./PermissionGate";

/**
 * 권한 없는 주소 접근을 막는다.
 *
 * **메뉴를 감추는 것만으로는 부족하다.** 주소를 직접 치면 그대로 열리고, 그때
 * 운영자는 "목록이 비었다"와 "볼 권한이 없다"를 구분할 수 없다.
 * 화면마다 검사를 넣으면 한 화면만 빠뜨려도 그 주소는 계속 열리므로 여기서 한 번에 본다.
 *
 * 사이드바 · 헤더는 그대로 두고 **본문만** 안내로 바꾼다. 통째로 가리면
 * 운영자가 다른 화면으로 이동할 방법이 사라진다.
 *
 * 실제로 막는 것은 서버다. 이 화면은 실수를 줄이는 장치일 뿐이다.
 */
const RoutePermissionGate = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const admin = useAdminStore((state) => state.admin);

  const required = findRoutePermission(pathname);

  if (
    required &&
    !hasPermission(admin?.permissions, required as PermissionKey, admin?.isSuperAdmin)
  ) {
    return <PermissionDenied required={required} />;
  }

  return <>{children}</>;
};

export default RoutePermissionGate;
