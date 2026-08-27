import type { PermissionKey } from "./permission";

/**
 * 직책.
 *
 * 권한은 사람이 아니라 **직책**이 갖는다. 관리자는 직책에 들어갈 뿐이다.
 * 사람이 바뀌어도 직책은 남고, 규칙이 바뀌면 직책 하나만 고치면 된다.
 */
export interface AdminRole {
  roleId: number;
  name: string;
  description: string;
  permissions: PermissionKey[];
  /**
   * 시스템이 보장하는 직책. **최고관리자 하나뿐이다.**
   *
   * 권한을 뺄 수도, 지울 수도 없다. 뺄 수 있으면 실수 한 번으로
   * "권한을 되돌릴 수 있는 사람이 아무도 없는" 상태가 만들어진다.
   */
  isSuperAdmin: boolean;
  /** 이 직책에 속한 관리자 수. 지우기 전에 옮길 사람이 있는지 보여 준다. */
  memberCount: number;
  createdAt: string;
}

export interface AdminRoleFormValues {
  name: string;
  description: string;
  permissions: PermissionKey[];
}

/**
 * 관리자 계정 상태.
 *
 * 활성/비활성 두 값으로는 운영에서 구분해야 할 것이 뭉개진다.
 * **초대해 두고 아직 안 들어온 계정**과 **실패가 쌓여 잠긴 계정**은
 * 해야 할 일이 다르다(전자는 임시 비밀번호를 다시 알려 주고, 후자는 잠금을 푼다).
 */
export type ManagerStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";

/** 로그인 실패가 이 횟수에 닿으면 계정을 잠근다. */
export const MANAGER_LOCK_THRESHOLD = 5;

/** 관리자 계정. 권한은 직접 갖지 않고 배정된 직책에서 가져온다. */
export interface Manager {
  managerId: number;
  name: string;
  email: string;
  roleId: number;
  /** 표에서 바로 보여 주기 위해 서버가 함께 내려준다. */
  roleName: string;
  status: ManagerStatus;
  /** 로그인 실패 누적. 성공하면 0으로 돌아간다. */
  failedLoginCount: number;
  lastLoginAt?: string;
  /** 마지막 접속 IP. 낯선 접속을 알아채는 최소 단서다. */
  lastLoginIp?: string;
  lockedAt?: string;
  invitedAt?: string;
  /**
   * 마지막으로 비밀번호를 바꾼 시각.
   * **값이 없으면 아직 임시 비밀번호를 쓰는 계정이다.**
   */
  passwordUpdatedAt?: string;
  createdAt: string;
}

/**
 * 관리자 추가 · 수정 폼.
 *
 * 상태는 여기에 없다. 추가는 항상 `INVITED`로 시작하고, 그 뒤의 상태 변경은
 * 잠금 해제 · 비활성처럼 **이유가 있는 개별 동작**이라 폼과 섞지 않는다.
 */
export interface ManagerFormValues {
  name: string;
  email: string;
  roleId: number;
}

/**
 * 초대 · 비밀번호 초기화 결과.
 *
 * 임시 비밀번호는 **이 응답에서 한 번만** 내려온다. 저장해 두고 다시 보여 주면
 * 어딘가에 평문으로 남는다는 뜻이고, 그러면 초기화 기능이 있는 의미가 없다.
 *
 * 계정 전체가 아니라 누구의 비밀번호인지 알아볼 값만 온다. 목록은 어차피
 * 이어서 다시 읽으므로 같은 자료를 두 경로로 받을 이유가 없다.
 */
export interface ManagerCredentialIssued {
  managerId: number;
  email: string;
  temporaryPassword: string;
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
  /** 응답 시간(ms). 같은 서버의 Redis는 1ms가 안 되므로 소수점이 올 수 있다. */
  latencyMs: number;
  message?: string;
}

/**
 * 서버 상태.
 *
 * 사용률과 절대량이 함께 온다. "메모리 75%"만으로는 조치를 정할 수 없다 —
 * 2GB 중 75%와 64GB 중 75%는 남은 여유가 다르다.
 */
export interface ServerHealth {
  status: HealthStatus;
  uptimeSeconds: number;
  cpuUsage: number;
  /** 이 서버에 주어진 코어 수 */
  cpuCores: number;
  memoryUsage: number;
  memoryUsedBytes: number;
  /** 머신(컨테이너)에 주어진 전체 메모리 */
  memoryTotalBytes: number;
  /**
   * JVM 힙 사용률.
   *
   * 머신 메모리와 따로 본다. 머신에 여유가 있어도 힙이 차면 GC가 돌기 시작하고,
   * 응답이 느려지는 원인은 그쪽인 경우가 많다.
   */
  heapUsage: number;
  heapUsedBytes: number;
  heapMaxBytes: number;
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
  /** 누가 했는지를 계정으로 고정한다. 이름은 바뀔 수 있어 필터 기준으로 쓸 수 없다. */
  actorId?: number;
  message: string;
  /** 무엇을 바꿨는지. 경로에서 뽑은 대상 종류와 식별자다. */
  targetType?: string;
  targetId?: string;
  /**
   * 요청 본문.
   *
   * "무엇을 바꿨나"에 답하려면 값이 남아야 한다. 비밀번호 · 토큰 필드는
   * 적재 시점에 마스킹한다(`maskAuditPayload`).
   */
  payload?: Record<string, unknown>;
  createdAt: string;
}

/** 처리 대기 건수. 사이드바 · 헤더 뱃지가 쓴다. */
export interface PendingCounts {
  report: number;
  qna: number;
  comment: number;
}
