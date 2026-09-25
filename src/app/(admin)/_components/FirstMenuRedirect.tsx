"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_MENU, isMenuShown } from "@/constants/menu";
import { useAdminStore } from "@/store/useAdminStore";
import { hasPermission, type PermissionKey } from "@/type/permission";

/**
 * 대시보드 지표가 실서버에 붙기 전까지, 실서버 환경의 첫 화면은 이 운영자가 볼 수 있는
 * 첫 메뉴로 넘긴다. 로그인 직후 목업 화면이나 오류 화면을 보지 않게 하기 위해서다.
 */
const FirstMenuRedirect = () => {
  const router = useRouter();
  const admin = useAdminStore((state) => state.admin);

  useEffect(() => {
    if (!admin) return;

    const isAllowed = (permission?: PermissionKey) =>
      !permission ||
      hasPermission(admin.permissions, permission, admin.isSuperAdmin);

    const firstHref = ADMIN_MENU.flatMap((group) =>
      group.href
        ? isMenuShown(group) && isAllowed(group.permission)
          ? [group.href]
          : []
        : (group.children ?? [])
            .filter((item) => isMenuShown(item) && isAllowed(item.permission))
            .map((item) => item.href),
    ).find((href) => href !== "/");

    if (firstHref) router.replace(firstHref);
  }, [admin, router]);

  return null;
};

export default FirstMenuRedirect;
