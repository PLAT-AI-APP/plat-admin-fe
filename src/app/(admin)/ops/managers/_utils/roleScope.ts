import type { AdminProfile } from "@/type/auth";
import type { AdminRole } from "@/type/ops";

/**
 * 이 운영자가 계정에 지정할 수 있는 직책인지.
 *
 * 최고관리자가 아니면 **자기 권한의 부분집합인 직책만** 줄 수 있다(서버도 그 외엔 403).
 * 자기보다 넓은 직책을 남에게 주고 그 계정의 비밀번호를 초기화하면 스스로 권한을 올린 것과 같다.
 * 판정은 직책 이름이 아니라 직책이 가진 권한 목록으로 한다.
 */
export const isRoleAssignable = (
  role: AdminRole,
  me: AdminProfile | null,
): boolean => {
  if (!me) return false;
  if (me.isSuperAdmin) return true;
  if (role.isSuperAdmin) return false;

  const granted = new Set(me.permissions);

  return role.permissions.every((permission) => granted.has(permission));
};
