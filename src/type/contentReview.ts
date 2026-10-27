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
  model: string | null;
  policyVersion: number | null;
  /** 수동 판정이면 `MANUAL_APPROVAL` · `MANUAL_REJECTION` */
  reasonCode: string | null;
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

/** 모든 AI 서버가 함께 쓰는 동시 검수 한도 */
export interface ContentReviewSettings {
  maxConcurrent: number;
  /** 지금 잡힌 실행 슬롯 수. 상태별 건수의 running 과 다를 수 있다. */
  activeExecutions: number;
  updatedBy: string | null;
  updatedAt: string;
}
