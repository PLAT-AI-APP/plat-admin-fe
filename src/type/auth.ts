import type { PermissionKey } from "./permission";

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
  roleId: number;
  roleName: string;
  /** 최고관리자는 권한 목록을 보지 않고 전부 통과한다. */
  isSuperAdmin: boolean;
  permissions: PermissionKey[];
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface LoginResponse {
  accessToken: string;
  /**
   * 재발급용 토큰.
   *
   * accessToken은 15분이라 이것 없이는 15분마다 로그인 화면으로 튕긴다.
   * 쿠키가 아니라 본문으로 오는 이유는 콘솔이 API와 다른 오리진이기 때문이다.
   */
  refreshToken: string;
  admin: AdminProfile;
  /**
   * 임시 비밀번호로 들어왔는지.
   *
   * 참이면 비밀번호를 바꾸기 전까지 콘솔을 쓸 수 없다. 초대 메일에 실린 비밀번호를
   * 그대로 쓰는 계정이 남아 있으면, 그 메일을 본 사람 전부가 관리자다.
   */
  mustChangePassword: boolean;
}

/** 재발급 결과. 두 토큰이 함께 바뀌므로 세션도 함께 갈아 끼운다. */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
