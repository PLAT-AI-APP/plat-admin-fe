import type { AdminRole } from "@/store/useAdminStore";

/** 관리자 계정 */
export interface Manager {
  managerId: number;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ManagerFormValues {
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}

/** 앱 버전 정책 */
export type AppPlatform = "IOS" | "AOS";

export interface AppVersion {
  versionId: number;
  platform: AppPlatform;
  latestVersion: string;
  minimumVersion: string;
  /** 최소 버전 미만일 때 강제 업데이트 여부 */
  isForceUpdate: boolean;
  updateMessage: string;
  updatedAt: string;
}

export interface AppVersionFormValues {
  platform: AppPlatform;
  latestVersion: string;
  minimumVersion: string;
  isForceUpdate: boolean;
  updateMessage: string;
}

/** 서버 상태 */
export type HealthStatus = "UP" | "DEGRADED" | "DOWN";

export interface DependencyHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
}

export interface ServerHealth {
  status: HealthStatus;
  uptimeSeconds: number;
  cpuUsage: number;
  memoryUsage: number;
  dependencies: DependencyHealth[];
  checkedAt: string;
}

/** 운영 로그 */
export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface OperationLog {
  logId: number;
  level: LogLevel;
  /** 어떤 도메인에서 발생했는지 */
  domain: string;
  action: string;
  actor: string;
  message: string;
  createdAt: string;
}
