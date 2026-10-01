"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_MENU, isMenuShown } from "@/constants/menu";
import { useAdminStore } from "@/store/useAdminStore";
import { hasPermission, type PermissionKey } from "@/type/permission";
import PermissionDenied from "@/components/domain/PermissionDenied";

/**
 * 대시보드를 볼 수 없는 운영자의 첫 화면. 이 운영자가 볼 수 있는 첫 메뉴로 넘긴다.
 */
const FirstMenuRedirect = () => {
  const router = useRouter();
  const admin = useAdminStore((state) => state.admin);

  const firstHref = useMemo(() => {
    if (!admin) return undefined;

    const isAllowed = (permission?: PermissionKey) =>
      !permission ||
      hasPermission(admin.permissions, permission, admin.isSuperAdmin);

    return ADMIN_MENU.flatMap((group) =>
      group.href
        ? isMenuShown(group) && isAllowed(group.permission)
          ? [group.href]
          : []
        : (group.children ?? [])
            .filter((item) => isMenuShown(item) && isAllowed(item.permission))
            .map((item) => item.href),
    ).find((href) => href !== "/");
  }, [admin]);

  useEffect(() => {
    if (firstHref) router.replace(firstHref);
  }, [firstHref, router]);

  /* 볼 수 있는 메뉴가 하나도 없으면 빈 화면 대신 무엇이 없는지 알려 준다. */
  if (admin && !firstHref) return <PermissionDenied required="dashboard:read" />;

  return null;
};

export default FirstMenuRedirect;
