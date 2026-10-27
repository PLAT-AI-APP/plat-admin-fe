import type { UserStatus } from "@/type/user";

/** 서비스 역할. 서비스 관리자는 ADMIN 이다. */
export type ServiceRole = "USER" | "CREATOR" | "ADMIN";

/**
 * 지금 서비스 관리자 한 명.
 *
 * 부여 시각·부여자·사유는 **가장 최근 부여 기록**이다. 이력 없이 DB 로 직접 준 계정이면 비어 있다.
 */
export interface ServiceAdmin {
  userId: string;
  nickname: string;
  email?: string;
  status: UserStatus;
  grantedAt?: string;
  grantedBy?: string;
  reason?: string;
}

/** 역할 변경 한 번. 부여는 USER→ADMIN, 회수는 ADMIN→USER 다. */
export interface RoleChange {
  historyId: string;
  userId: string;
  /** 탈퇴 등으로 찾지 못하면 비어 있다. */
  nickname?: string;
  fromRole: ServiceRole;
  toRole: ServiceRole;
  reason: string;
  adminName: string;
  changedAt: string;
}
