"use client";

import { ReactNode } from "react";
import { useHasPermission } from "@/store/useAdminStore";
import type { PermissionKey } from "@/type/permission";
import PermissionDenied from "./PermissionDenied";

interface PermissionGateProps {
  required: PermissionKey;
  children: ReactNode;
  /** 막혔을 때 대신 그릴 것. 비우면 안내 화면이 나온다. */
  fallback?: ReactNode;
}

/**
 * 권한이 있을 때만 자식을 그린다.
 *
 * 화면을 감추는 것은 **실수를 줄이는 장치일 뿐** 막는 수단이 아니다.
 * 실제로 막는 것은 서버다. 둘 다 있어야 하는 이유는,
 * 서버만 있으면 운영자가 끝까지 입력한 뒤에야 거부당하고,
 * 화면만 있으면 주소를 직접 치는 순간 통과하기 때문이다.
 */
const PermissionGate = ({
  required,
  children,
  fallback,
}: PermissionGateProps) => {
  const allowed = useHasPermission(required);

  if (allowed) return <>{children}</>;

  return <>{fallback ?? <PermissionDenied required={required} />}</>;
};

export default PermissionGate;
