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

/* -------------------------------------------------------------------------
 * 관리자 활동 로그(감사)
 * ---------------------------------------------------------------------- */

/**
 * 감사 로그의 도메인.
 *
 * 서버가 요청 경로에서 정한다. 화면이 목록을 들고 있으면 새 API가 생길 때마다
 * 화면도 같이 고쳐야 하므로, **값의 주인은 서버**다. 여기 목록은 필터 선택지와
 * 한국어 라벨을 붙이기 위한 것이고, 모르는 값이 와도 원문을 그대로 보여 준다.
 */
export const LOG_DOMAINS = [
  "USER",
  "UNIVERSE",
  "COMMUNITY",
  "BILLING",
  "AI",
  "MAIN_EXPOSURE",
  "OPS",
] as const;

export type LogDomain = (typeof LOG_DOMAINS)[number];

/**
 * 관리자 활동의 결과.
 *
 * **성공만 남기면 감사가 되지 않는다.** 권한이 없어 막힌 시도(`DENIED`)가
 * 오히려 먼저 봐야 할 기록이다. 서버 오류로 끝난 것(`FAILED`)은 그 사람의
 * 의도는 있었으나 반영되지 않았다는 뜻이라 또 다르게 읽어야 한다.
 */
export type AuditResult = "SUCCESS" | "DENIED" | "FAILED";

/**
 * 관리자 활동 로그.
 *
 * 답해야 하는 질문은 하나다 — **누가, 무엇을, 어떤 값으로 바꿨나.**
 * 그래서 레벨(INFO/WARN/ERROR)이 없다. 사람이 한 변경에 심각도를 매기는 것은
 * 의미가 없고, 감사에서 갈라 봐야 하는 것은 심각도가 아니라 `result`다.
 */
export interface AdminAuditLog {
  /** Snowflake라 문자열이다. 숫자로 받으면 자바스크립트가 뒷자리를 잘라 먹는다. */
  logId: string;
  /** 실행한 관리자 이름. 표시용이다. */
  actor: string;
  /** 누가 했는지를 계정으로 고정한다. 이름은 바뀔 수 있어 필터 기준으로 쓸 수 없다. */
  actorId?: number;
  /** 실행 시점의 직책. 지금 직책이 바뀌어도 **당시 권한**을 알 수 있어야 한다. */
  roleName?: string;
  action: string;
  domain: LogDomain | (string & {});
  /** 무엇을 바꿨는지. 경로에서 뽑은 대상 종류와 식별자다. */
  targetType?: string;
  targetId?: string;
  result: AuditResult;
  message: string;
  /**
   * 요청 본문.
   *
   * "무엇을 바꿨나"에 답하려면 값이 남아야 한다. 비밀번호 · 토큰 필드는
   * 서버가 적재 시점에 마스킹한다.
   *
   * 서버는 이것을 **문자열로** 내려준다 — 마스킹하고 4KB로 자른 본문이라 늘
   * 유효한 JSON이라는 보장이 없어서다. 객체로 펼치는 일은 API 레이어가 맡고,
   * 펼치지 못하면 원문을 그대로 한 줄로 보여 준다.
   *
   * 값이 그대로 남는다는 것은 이 로그가 **다른 관리자의 작업 내용을 전부
   * 드러낸다**는 뜻이다. `log:read`를 민감 권한으로 둔 이유다.
   */
  payload?: Record<string, unknown>;
  /** 접속 IP. 낯선 곳에서 들어온 변경을 알아채는 최소 단서다. */
  ip?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------
 * 시스템 이벤트 로그
 * ---------------------------------------------------------------------- */

/**
 * 시스템 이벤트의 심각도.
 *
 * `INFO`가 없다. 정상 동작까지 어드민으로 끌어오면 볼륨이 폭발하고, 그러면
 * 정작 봐야 할 것이 묻힌다. **조치가 필요한 것만** 여기로 온다.
 */
export type SystemEventLevel = "WARN" | "ERROR";

/** 이벤트가 난 곳. 어디를 봐야 하는지를 바로 가리킨다. */
export const SYSTEM_EVENT_SOURCES = [
  "API",
  "DB",
  "AI_PROVIDER",
  "PAYMENT",
  "PUSH",
  "STORAGE",
] as const;

export type SystemEventSource = (typeof SYSTEM_EVENT_SOURCES)[number];

/**
 * 시스템 이벤트.
 *
 * 원본 애플리케이션 로그가 아니다. 서버가 예외 알림을 지문으로 묶어 **한 종류에
 * 한 줄씩** 내려준다. 발생마다 한 줄씩 쌓으면 장애가 난 순간 같은 문장으로 화면이
 * 가득 차, 정작 필요한 "몇 종류가 났는가"를 볼 수 없게 된다.
 *
 * 그래서 시각이 둘이다. 같은 오류가 200번 났을 때 필요한 정보는 200줄이 아니라
 * "언제 시작해서 마지막이 언제였고 몇 번이었나"이다.
 */
export interface SystemEventLog {
  /** Snowflake라 문자열이다. 숫자로 받으면 자바스크립트가 뒷자리를 잘라 먹는다. */
  eventId: string;
  level: SystemEventLevel;
  source: SystemEventSource | (string & {});
  message: string;
  /** 가장 최근 발생 건의 요청 추적 키. 액세스 로그에서 그 요청을 찾아가는 실마리다. */
  traceId?: string;
  /** 묶인 발생 횟수. 1이면 단발이다. */
  occurrenceCount: number;
  firstOccurredAt: string;
  lastOccurredAt: string;
}

/* -------------------------------------------------------------------------
 * 배치(스케줄) 작업
 * ---------------------------------------------------------------------- */

/**
 * 배치 실행 결과.
 *
 * `SKIPPED`를 따로 둔다. 처리할 대상이 없어 넘어간 것과 실제로 실패한 것을
 * 같은 값으로 두면, 매일 아무 일도 하지 않는 잡이 "정상"으로 보인다.
 */
export type BatchRunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

/** 무엇이 실행을 걸었나. 수동 실행은 관리자 활동 로그에도 함께 남는다. */
export type BatchTrigger = "SCHEDULE" | "MANUAL";

/**
 * 배치 잡 정의.
 *
 * 이 화면은 로그가 아니라 **관리** 화면이다. 이력만 보는 것이 아니라 실패한 잡을
 * 다시 돌리는 행위가 붙기 때문에, 조회만 있는 `log` 권한에 묶을 수 없다.
 */
export interface BatchJob {
  /**
   * 서버가 아는 잡 식별자. 수동 실행 요청에 그대로 싣는다.
   *
   * 숫자 ID가 없다. **잡 정의를 담은 표가 서버에 없기 때문**이다 — 잡의 원본은
   * 코드고, 어드민이 만들거나 지우지 않으므로 행에 붙일 번호도 없다.
   */
  jobKey: string;
  name: string;
  description: string;
  /** 크론식. 화면에는 사람이 읽는 주기 설명과 함께 보여 준다. */
  cronExpression: string;
  /**
   * 스케줄 사용 여부.
   *
   * 꺼도 잡 정의는 남는다. 지워 버리면 "왜 이 배치가 없어졌는지"를
   * 아무도 알 수 없게 된다.
   */
  isEnabled: boolean;
  lastRunStatus?: BatchRunStatus;
  lastRunAt?: string;
  /** 다음 실행 예정. 꺼져 있으면 값이 없다. */
  nextRunAt?: string;
}

/**
 * 배치 실행 이력 한 건.
 *
 * 관리자 로그와 컬럼이 겹치지 않는다. 여기서 답해야 하는 질문은 "누가 바꿨나"가
 * 아니라 **"제대로 돌았나, 다시 돌려야 하나"** 이기 때문이다.
 */
export interface BatchJobRun {
  runId: number;
  jobKey: string;
  /** 표에서 바로 보여 주기 위해 서버가 함께 내려준다. */
  jobName: string;
  status: BatchRunStatus;
  trigger: BatchTrigger;
  /** 수동 실행일 때만 있다. 스케줄 실행에는 사람이 없다. */
  actor?: string;
  actorId?: number;
  startedAt: string;
  /** 아직 도는 중이면 없다. */
  finishedAt?: string;
  durationMs?: number;
  /** 처리한 건수. 0건 성공과 실패를 구분하는 값이다. */
  processedCount?: number;
  failedCount?: number;
  /** 실패 사유. 재실행 전에 먼저 읽어야 하는 값이다. */
  errorMessage?: string;
  /**
   * 실행 로그. 줄바꿈이 섞인 **평문 문자열**이다.
   *
   * 구조를 잡지 않는다. 배치마다 남기는 것이 달라 공통 스키마를 만들면 대부분의
   * 잡에서 빈 필드가 되고, 새 잡이 생길 때마다 타입을 고쳐야 한다. 운영자가
   * 여기서 하는 일은 "왜 실패했는지 눈으로 읽는 것" 하나라 평문이면 충분하다.
   *
   * 원본 전체가 아니라 **끝부분만** 온다. 한 번에 수만 줄을 남기는 잡이 있어
   * 전문을 실으면 목록 응답이 통째로 무거워진다. 전문은 관제 도구에서 본다.
   */
  log?: string;
}

/** 처리 대기 건수. 사이드바 · 헤더 뱃지가 쓴다. */
export interface PendingCounts {
  report: number;
  qna: number;
  comment: number;
}
