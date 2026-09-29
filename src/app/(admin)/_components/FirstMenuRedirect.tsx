"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_MENU, isMenuShown } from "@/constants/menu";
import { useAdminStore } from "@/store/useAdminStore";
import { hasPermission, type PermissionKey } from "@/type/permission";

/**
 * 대시보드를 볼 수 없는 운영자의 첫 화면. 이 운영자가 볼 수 있는 첫 메뉴로 넘긴다.
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
