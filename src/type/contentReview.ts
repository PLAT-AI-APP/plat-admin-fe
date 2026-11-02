import type { ServiceLanguage } from "./language";

/**
 * 목록 상태 탭.
 *
 * `MANUAL`은 AI가 확정하지 못해 **관리자가 봐야 하는 건**이다. 반려(`REJECTED`)와 다르다.
 */
export type ContentReviewQueueStatus =
  | "READY"
  | "RUNNING"
  | "MANUAL"
  | "APPROVED"
  | "REJECTED";

/** 검수 대상. FILE 은 이미지이고 `targetId`는 파일 ID 다. */
export type ContentReviewTargetType =
  | "CHARACTER"
  | "UNIVERSE_CHARACTER"
  | "UNIVERSE"
  | "FILE";

/** 작업 진행 상태. 콘텐츠 판정 상태(`reviewStatus`)와 따로 본다. */
export type ContentReviewJobStatus = "READY" | "RUNNING" | "COMPLETED" | "MANUAL";

export type ContentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ContentReviewFindingField =
  | "NAME"
  | "DESCRIPTION"
  | "DETAIL_SETTING"
  | "UNIVERSE"
  | "CHARACTER"
  | "SCENARIO"
  | "ASSET"
  | "MULTIPLE";

/** 제작자에게 보여 줄 수정 안내. 원문은 인용하지 않는다. */
export interface ContentReviewFinding {
  language: ServiceLanguage;
  field: ContentReviewFindingField;
  guide: string;
}

export interface ContentReviewInput {
  texts: {
    language: ServiceLanguage;
    name: string;
    description: string;
    detailSetting: string;
  }[];
  fields: { path: string; value: string }[];
  /** `originalUrl`은 서명 주소라 만료된다. 만료되면 목록을 다시 받는다. */
  images: { fileId: string; fileType: string; originalUrl: string }[];
}

/** 검수 작업 한 건. 시간은 모두 UTC 다. */
export interface ContentReviewTask {
  taskId: string;
  targetType: ContentReviewTargetType;
  targetId: string;
  input: ContentReviewInput;
  reviewStatus: ContentReviewStatus;
  jobStatus: ContentReviewJobStatus;
  attempts: number;
  /** 재검수·수동 판정으로 대체된 과거 이력 */
  superseded: boolean;
  supersededAt: string | null;
  /** 관리자 승인만 풀 수 있는 건(성인 해제·관리자 반려 뒤 수정) */
  manualRequired: boolean;
  model: string | null;
  policyVersion: number | null;
  /** 수동 판정이면 `MANUAL_APPROVAL` · `MANUAL_REJECTION` */
  reasonCode: string | null;
  /** 관리자 확인 대기의 사유 묶음. 분류는 서버가 정하고, MANUAL 이 아니면 null */
  reasonGroup: ContentReviewReasonGroup | null;
  reason: string | null;
  findings: ContentReviewFinding[];
  /** 수동 판정자 또는 AI 재검수 요청자. 있다고 수동 판정은 아니다. */
  adminId: string | null;
  createdAt: string;
  imageAdult: boolean | null;
  completedAt: string | null;
  nextAttemptAt: string | null;
  leaseExpiresAt: string | null;
  leaseExpired: boolean;
  /**
   * 세계관 작업만. 본문은 승인돼도 연결 이미지 때문에 공개되지 않은 이유.
   * `IMAGE_PENDING`(이미지 검수 대기) · `IMAGE_REJECTED`(이미지 반려) · `ADULT_SETTING_REQUIRED`(성인 설정 필요)
   */
  imageHoldCode: string | null;
}

/** 대체된 이력을 뺀 현재 작업 수. 세계관 수가 아니라 작업 수다. */
export interface ContentReviewCounts {
  total: number;
  ready: number;
  running: number;
  manual: number;
  approved: number;
  rejected: number;
}

/** 관리자 확인 대기의 사유 묶음. AI 장애는 다시 맡기면 되고, 판단 보류는 사람이 봐야 한다. */
export type ContentReviewReasonGroup = "AI_FAILURE" | "AI_HOLD";

/** AI 서버가 검수 종류별로 보내는 준비 상태. 꺼짐은 설정, 프롬프트 없음은 운영 누락이다. */
export type ReviewProcessorState = "READY" | "DISABLED" | "NO_PROMPT";

export type ReviewProcessorType = "UNIVERSE" | "FILE" | "CHARACTER";

/** 신호(15초 TTL)가 살아 있는 AI 인스턴스 하나 */
export interface ContentReviewWorker {
  instanceId: string;
  startedAt: string;
  lastSeenAt: string;
  active: number;
  processors: Partial<Record<ReviewProcessorType, ReviewProcessorState>>;
}

/** 지금 실행 슬롯을 잡은 작업 */
export interface ContentReviewActiveExecution {
  taskId: string;
  targetType: ContentReviewTargetType;
  targetId: string;
  title: string | null;
  thumbnailUrl: string | null;
  attempt: number;
  instanceId: string;
  startedAt: string;
  leaseExpiresAt: string;
}

/** 처리량 차트 한 칸. 1시간은 5분, 6시간은 15분, 24시간은 1시간 단위다. */
export interface ContentReviewSeriesPoint {
  bucketStart: string;
  approved: number;
  rejected: number;
  manual: number;
  failed: number;
}

export type ContentReviewMonitorRange = "1h" | "6h" | "24h";

/** 관제 화면 한 장에 필요한 값. 요청 시점의 DB · Redis 상태다. */
export interface ContentReviewMonitor {
  settings: {
    maxConcurrent: number;
    /** 관리자가 멈춘 상태. 풀 때까지 유지된다. */
    paused: boolean;
    /** 제공사 연속 실패로 자동으로 멈춘 경우 다시 시작하는 시각 */
    pausedUntil: string | null;
    updatedBy: string | null;
    updatedAt: string;
  };
  workers: ContentReviewWorker[];
  queue: {
    readyDue: number;
    retrying: number;
    running: number;
    manual: number;
    manualAiFailure: number;
    oldestReadyAt: string | null;
    oldestManualAt: string | null;
  };
  active: ContentReviewActiveExecution[];
  lastHour: {
    completed: number;
    failed: number;
    manual: number;
    avgMs: number | null;
    p95Ms: number | null;
  };
  series: ContentReviewSeriesPoint[];
}

export type ContentReviewAttemptOutcome = "APPROVED" | "REJECTED" | "MANUAL" | "FAILED" | "STALE";

/** AI 호출 한 번의 기록. 실패 원인은 작업이 아니라 여기에 남는다. 30일 보관. */
export interface ContentReviewAttempt {
  attemptId: string;
  taskId: string;
  targetType: ContentReviewTargetType;
  targetId: string;
  title: string | null;
  attempt: number;
  instanceId: string;
  model: string | null;
  startedAt: string;
  finishedAt: string | null;
  outcome: ContentReviewAttemptOutcome;
  errorCode: string | null;
  durationMs: number | null;
}

/** 세계관 하나와 연결 이미지의 모든 작업(대체된 것 포함)과 시도 */
export interface UniverseReviewTimeline {
  universeId: string;
  tasks: ContentReviewTask[];
  attempts: ContentReviewAttempt[];
}

export interface ContentReviewBulkRetryResult {
  results: { taskId: string; ok: boolean; errorCode: string | null }[];
}
