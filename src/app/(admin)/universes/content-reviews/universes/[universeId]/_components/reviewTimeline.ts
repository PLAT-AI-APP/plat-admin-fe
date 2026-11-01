import type { BadgeTone } from "@/components/ui/Badge";
import type { ContentReviewAttempt, ContentReviewTask } from "@/type/contentReview";
import {
  imageFileTypeLabel,
  isManualDecision,
  manualReasonLabel,
  taskTargetImage,
} from "../../../_lib/reviewMeta";

export type TimelineGroup = "universe" | "file" | "admin";

export interface TimelineEvent {
  key: string;
  group: TimelineGroup;
  at: string;
  kind: string;
  kindTone: BadgeTone | "dark";
  target: string;
  title: string;
  body: string | null;
  task: ContentReviewTask;
  attempts: ContentReviewAttempt[];
  /** 접수 이벤트에는 시도 · 수정 안내를 다시 싣지 않는다 */
  isIntake: boolean;
}

const targetLabel = (task: ContentReviewTask) =>
  task.targetType === "FILE" ? imageFileTypeLabel(taskTargetImage(task)?.fileType) : "세계관 본문";

/** 작업 하나의 결과 이벤트. 아직 끝나지 않은 작업은 진행 상태로 보여 준다. */
const resultEvent = (task: ContentReviewTask, attempts: ContentReviewAttempt[]): TimelineEvent => {
  const base = {
    key: `${task.taskId}-result`,
    group: (task.targetType === "FILE" ? "file" : "universe") as TimelineGroup,
    at: task.completedAt ?? task.createdAt,
    target: targetLabel(task),
    body: task.reason,
    task,
    attempts,
    isIntake: false,
  };
  const grade = task.imageAdult === null ? "" : task.imageAdult ? " · 성인 등급" : " · 일반 등급";

  if (isManualDecision(task)) {
    const approved = task.reviewStatus === "APPROVED";
    return {
      ...base,
      group: "admin",
      kind: "관리자 판정",
      kindTone: "dark",
      title: `${approved ? "승인" : "반려"}${grade}${task.adminId ? ` — 관리자 ${task.adminId}` : ""}`,
    };
  }
  if (task.jobStatus === "MANUAL") {
    return { ...base, kind: "관리자에게 넘김", kindTone: "danger", title: manualReasonLabel(task) };
  }
  if (task.jobStatus === "READY") {
    return { ...base, at: task.createdAt, kind: "자동 검수 대기", kindTone: "neutral", title: "AI 검수를 기다리는 중" };
  }
  if (task.jobStatus === "RUNNING") {
    return { ...base, at: task.createdAt, kind: "검수 중", kindTone: "info", title: "AI 가 검수하는 중" };
  }
  return {
    ...base,
    kind: "AI 판정",
    kindTone: "brand",
    title: `${task.reviewStatus === "REJECTED" ? "반려" : "승인"}${grade}`,
  };
};

/**
 * 작업 목록을 화면 이벤트로 편다. 세계관 작업은 접수와 결과를 따로 보여 주고,
 * 이미지와 관리자 판정은 결과 하나만 보여 준다(접수는 세계관 저장과 같은 순간이라 겹친다).
 */
export const buildTimeline = (tasks: ContentReviewTask[], attempts: ContentReviewAttempt[]) => {
  const attemptsByTask = new Map<string, ContentReviewAttempt[]>();
  attempts.forEach((attempt) => {
    attemptsByTask.set(attempt.taskId, [...(attemptsByTask.get(attempt.taskId) ?? []), attempt]);
  });

  const events = tasks.flatMap((task) => {
    const taskAttempts = (attemptsByTask.get(task.taskId) ?? []).sort((left, right) => left.attempt - right.attempt);
    const result = resultEvent(task, taskAttempts);
    const isPending = task.jobStatus === "READY" || task.jobStatus === "RUNNING";
    if (task.targetType === "FILE" || isManualDecision(task) || isPending) return [result];

    const intake: TimelineEvent = {
      key: `${task.taskId}-intake`,
      group: "universe",
      at: task.createdAt,
      kind: "접수",
      kindTone: "neutral",
      target: "세계관 본문",
      title: task.adminId ? `관리자 ${task.adminId} 가 AI 재검수 요청` : "저장된 내용으로 검수 접수",
      body: null,
      task,
      attempts: [],
      isIntake: true,
    };
    return [result, intake];
  });

  return events.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
};
