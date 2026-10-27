"use client";

import type { ReactNode } from "react";
import { useCan } from "@/hooks/useCan";
import type { PermissionKey } from "@/type/permission";

interface CanProps {
  permission: PermissionKey;
  children: ReactNode;
  /** 권한이 없을 때 대신 그릴 것. 비우면 아무것도 그리지 않는다. */
  fallback?: ReactNode;
}

/**
 * 권한이 있을 때만 버튼 · 메뉴 같은 **조치**를 그린다.
 *
 * `PermissionGate` 는 화면 한 덩어리를 안내로 바꾸고, 이건 조치 하나를 조용히 감춘다.
 * 볼 수는 있지만 고칠 수 없는 운영자에게 누르면 403 이 나는 버튼을 보여 주면
 * 고장으로 읽힌다. 실제로 막는 것은 여전히 서버다.
 */
const Can = ({ permission, children, fallback = null }: CanProps) => {
  const allowed = useCan(permission);

  return <>{allowed ? children : fallback}</>;
};

export default Can;
