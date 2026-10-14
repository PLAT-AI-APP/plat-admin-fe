import type { PermissionKey } from "./permission";
import type { AdminRoleRef } from "./ops";

/**
 * 로그인한 관리자.
 *
 * 권한 키 목록을 함께 들고 온다. 직책 이름으로 판단하면 직책을 새로 만드는 순간
 * 어긋나므로, 화면은 언제나 이 목록(또는 `isSuperAdmin`)만 본다.
 */
export interface AdminProfile {
  managerId: number;
  name: string;
  email: string;
  /**
   * 가진 직책들(roleId 오름차순).
   * 옛 세션(localStorage)에는 없을 수 있으므로 읽을 때는 `?? []` 로 막는다.
   */
  roles: AdminRoleRef[];
  /** 직책 중 하나라도 최고관리자면 참. 최고관리자는 권한 목록을 보지 않고 전부 통과한다. */
  isSuperAdmin: boolean;
  /** 가진 직책들의 권한을 모두 합친 것(최고관리자면 빈 배열). */
  permissions: PermissionKey[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminProfile;
  /**
   * 임시 비밀번호로 들어왔는지.
   *
   * 참이면 비밀번호를 바꾸기 전까지 콘솔을 쓸 수 없다. 초대 메일에 실린 비밀번호를
   * 그대로 쓰는 계정이 남아 있으면, 그 메일을 본 사람 전부가 관리자다.
   */
  mustChangePassword: boolean;
}

/**
 * 재발급 결과. 재발급 토큰은 HttpOnly 쿠키(`adminRefreshToken`)로만 오가서 본문에는 access 토큰만 쓴다.
 * 본문에 실어 localStorage 에 두면 XSS 한 번에 12시간 세션이 빠져나간다.
 */
export interface TokenResponse {
  accessToken: string;
}
