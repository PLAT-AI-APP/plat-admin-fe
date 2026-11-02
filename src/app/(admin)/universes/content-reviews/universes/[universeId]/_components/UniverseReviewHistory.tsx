"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUniverseReviewTimelineQuery } from "@/api/contentReview/getContentReviews";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import { UNIVERSE_VISIBILITY_LABEL } from "@/constants/universeOptions";
import { formatDateTime, formatDateTimeSecond, toKst } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { ChevronDown } from "@/icons";
import { useHasPermission } from "@/store/useAdminStore";
import type { ContentReviewTask } from "@/type/contentReview";
import { SERVICE_LANGUAGE_LABEL } from "@/type/language";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Skeleton from "@/components/ui/Skeleton";
import {
  ATTEMPT_OUTCOME_LABEL,
  FINDING_FIELD_LABEL,
  attemptErrorLabel,
  canDecide,
  canRetry,
  formatDurationMs,
  formatWaited,
  imageFileTypeLabel,
  isAiFailure,
  manualReasonLabel,
  taskStatusBadge,
  taskTargetImage,
  taskTitle,
} from "../../../_lib/reviewMeta";
import ReviewDecisionPanel from "../../../_components/ReviewDecisionPanel";
import ReviewInputView from "../../../_components/ReviewInputView";
import { buildTimeline, type TimelineGroup } from "./reviewTimeline";

const FILTERS: { label: string; value: TimelineGroup | "all" }[] = [
  { label: "전체", value: "all" },
  { label: "세계관 본문", value: "universe" },
  { label: "이미지", value: "file" },
  { label: "관리자 판정", value: "admin" },
];

/** 타임라인 점 색. 판정 주체가 먼저 읽혀야 한다. */
const DOT_CLASS: Record<string, string> = {
  dark: "bg-font-1",
  danger: "bg-danger",
  brand: "bg-brand",
  info: "bg-info",
  neutral: "bg-font-disabled",
};

const isAdultInput = (task: ContentReviewTask) =>
  task.input.fields.some((field) => field.path === "adult" && field.value === "true");

/** 지금 판정할 수 있는 세계관 작업. 대체되지 않은 가장 최근 것 하나다. */
const CurrentDecisionCard = ({ task }: { task: ContentReviewTask }) => {
  const canWrite = useHasPermission("universe:write");
  const badge = taskStatusBadge(task);
  const isManual = task.jobStatus === "MANUAL";

  return (
    <Card
      title={isManual ? "지금 처리할 판정" : "현재 검수 작업"}
      description={`세계관 본문 · 작업 ${task.taskId} · 접수 ${formatDateTime(task.createdAt)}${
        isManual ? ` · ${formatWaited(task.createdAt)} 대기` : ""
      }`}
      action={
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={isManual ? (isAiFailure(task) ? "danger" : "warning") : badge.tone}>
            {isManual ? manualReasonLabel(task) : badge.label}
          </Badge>
          {task.reasonCode && <Badge>{task.reasonCode}</Badge>}
        </span>
      }
    >
      <div className="flex flex-col gap-3.5">
        {task.reason && <p className="body-5 whitespace-pre-wrap wrap-anywhere text-font-1">{task.reason}</p>}
        {task.findings.length > 0 && (
          <ul className="flex flex-col gap-1">
            {task.findings.map((finding, index) => (
              <li key={index} className="flex gap-2 body-5 text-font-1">
                <Badge tone="warning">
                  {SERVICE_LANGUAGE_LABEL[finding.language] ?? finding.language} ·{" "}
                  {FINDING_FIELD_LABEL[finding.field] ?? finding.field}
                </Badge>
                <span>{finding.guide}</span>
              </li>
            ))}
          </ul>
        )}
        <ReviewInputView key={`input-${task.taskId}`} input={task.input} />
        {canWrite && (canDecide(task) || canRetry(task)) && <ReviewDecisionPanel key={`decision-${task.taskId}`} task={task} />}
      </div>
    </Card>
  );
};

/** 연결 이미지의 현재 검수. 관리자 확인이 필요한 이미지는 그 자리에서 등급과 함께 판정한다. */
const ImageTaskList = ({ tasks }: { tasks: ContentReviewTask[] }) => {
  const canWrite = useHasPermission("universe:write");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  return (
    <Card
      noPadding
      title={`연결 이미지 ${tasks.length}장`}
      description="이미지가 모두 승인돼야 세계관 본문 검수가 시작됩니다."
    >
      {tasks.length === 0 ? (
        <p className="px-5 py-4 body-5 text-font-2">검수할 연결 이미지가 없습니다.</p>
      ) : (
        <ul className="flex flex-col px-3 py-2">
          {tasks.map((task) => {
            const image = taskTargetImage(task);
            const badge = taskStatusBadge(task);
            const isOpen = openTaskId === task.taskId;
            const grade = task.imageAdult === null ? "" : task.imageAdult ? " · 성인" : " · 일반";
            return (
              <li key={task.taskId} className="rounded-field p-2">
                <div className="flex items-center gap-2.5">
                  {image ? (
                    <a href={image.originalUrl} target="_blank" rel="noreferrer" className="w-10 shrink-0">
                      <EntityImage src={image.originalUrl} alt={`${imageFileTypeLabel(image.fileType)} 원본`} fileId={image.fileId} />
                    </a>
                  ) : (
                    <span aria-hidden className="size-10 shrink-0 rounded-chip bg-subtle" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate title-6 text-font-1">{taskTitle(task)}</p>
                    <p className="body-6 text-font-2">
                      파일 <span className="font-mono">{task.targetId}</span> ·{" "}
                      {formatDateTime(task.completedAt ?? task.createdAt)}
                    </p>
                  </div>
                  {canWrite && canDecide(task) ? (
                    <Button size="sm" variant="primary" onClick={() => setOpenTaskId(isOpen ? null : task.taskId)}>
                      {isOpen ? "닫기" : "판정하기"}
                    </Button>
                  ) : (
                    <Badge tone={badge.tone}>
                      {badge.label}
                      {task.reviewStatus === "APPROVED" && grade}
                    </Badge>
                  )}
                </div>
                {isOpen && (
                  <div className="mt-2 border-t border-border-main pt-3">
                    {task.reason && <p className="mb-2 body-5 text-font-1">{task.reason}</p>}
                    <ReviewDecisionPanel key={`decision-${task.taskId}`} task={task} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

const Stat = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
  <div>
    <p className="body-6 text-font-2">{label}</p>
    <p className={cn("mt-0.5 title-1 tabular-nums", danger && value > 0 ? "text-danger" : "text-font-1")}>
      {value}회
    </p>
  </div>
);

/**
 * 세계관 하나의 검수 이력. 세계관 본문과 연결 이미지의 접수 · AI 판정 · 관리자 판정 · 실패 시도를
 * 최신순으로 펴고, 지금 판정할 건이 있으면 맨 위에서 처리한다.
 */
const UniverseReviewHistory = ({ universeId }: { universeId: string }) => {
  const [filter, setFilter] = useState<TimelineGroup | "all">("all");
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const toggleOpen = (key: string) =>
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((each) => each !== key) : [...prev, key]));
  const timelineQuery = useUniverseReviewTimelineQuery(universeId);
  const detailQuery = useUniverseDetailQuery(universeId);
  const tasks = useMemo(() => timelineQuery.data?.tasks ?? [], [timelineQuery.data]);
  const attempts = useMemo(() => timelineQuery.data?.attempts ?? [], [timelineQuery.data]);
  const events = useMemo(() => buildTimeline(tasks, attempts), [tasks, attempts]);

  const currentUniverseTask = tasks.find((task) => task.targetType === "UNIVERSE" && !task.superseded);
  const imageTasks = tasks.filter((task) => task.targetType === "FILE" && !task.superseded);
  const detail = detailQuery.data;
  const title =
    detail?.translations.find((translation) => translation.language === "KO")?.title ??
    detail?.translations[0]?.title ??
    (currentUniverseTask ? taskTitle(currentUniverseTask) : `세계관 ${universeId}`);
  const profileImage = currentUniverseTask?.input.images.find((image) => image.fileType === "UNIVERSE_PROFILE");
  const visibleEvents = events.filter((event) => filter === "all" || event.group === filter);
  const statusBadge = currentUniverseTask ? taskStatusBadge(currentUniverseTask) : null;
  /* 서버 공개 조건과 같다: 활성 · 비공개 아님 · 제한 없음 · 검수 승인(작업이 없으면 기존 승인 유지). */
  const isExposed =
    !!detail &&
    detail.status === "ACTIVE" &&
    detail.visibility !== "PRIVATE" &&
    detail.moderationStatus === "CLEAR" &&
    (!currentUniverseTask || currentUniverseTask.reviewStatus === "APPROVED");

  // 없는 ID(404)·잘못된 ID(400)를 빈 이력처럼 그리면 현재 상태·누적 칸이 사실처럼 보인다.
  const isMissing = timelineQuery.error?.status === 404 || timelineQuery.error?.status === 400;
  if (isMissing) {
    return (
      <>
        <BackLink href="/universes/content-reviews" label="검수 관제" />
        <PageHeader title={`세계관 ${universeId}`} description="검수 이력" />
        <Card>
          <EmptyState
            title="세계관을 찾을 수 없습니다."
            description="ID 를 다시 확인해 주세요. 파기된 세계관은 검수 이력도 함께 지워집니다."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <BackLink href="/universes/content-reviews" label="검수 관제" />
      <PageHeader
        title={title}
        description={`세계관 ${universeId}${
          detail ? ` · 제작자 ${detail.creator.nickname}` : ""
        } · 검수 기록 ${events.length}건 · AI 이력 90일, 관리자 판정은 영구 보관`}
        action={
          <Link
            href={`/universes/${universeId}`}
            className="inline-flex h-10 items-center rounded-field border border-border-strong bg-surface px-4 body-4 font-medium text-font-1 transition hover:bg-surface-hover"
          >
            세계관 상세
          </Link>
        }
      />

      {timelineQuery.isError && <Alert tone="danger">검수 이력을 불러오지 못했습니다.</Alert>}

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
          {timelineQuery.isLoading ? (
            <Skeleton className="h-64 w-full rounded-card" />
          ) : (
            currentUniverseTask && <CurrentDecisionCard task={currentUniverseTask} />
          )}

          <Card
            noPadding
            title="검수 이력"
            description="세계관 본문과 연결 이미지의 모든 접수 · AI 판정 · 관리자 판정 · 실패 시도를 최신순으로 보여 줍니다. 줄을 누르면 시도 기록과 작업 정보가 펼쳐집니다."
            action={
              <div role="group" aria-label="이력 필터" className="flex flex-wrap gap-1.5">
                {FILTERS.map((each) => {
                  const isOn = filter === each.value;
                  return (
                    <button
                      key={each.value}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => setFilter(each.value)}
                      className={cn(
                        "h-8 rounded-full border px-3 body-5 transition",
                        isOn
                          ? "border-brand bg-surface-selected font-semibold text-brand"
                          : "border-border-strong bg-surface font-medium text-font-1 hover:bg-surface-hover",
                      )}
                    >
                      {each.label}
                    </button>
                  );
                })}
              </div>
            }
          >
            {timelineQuery.isLoading ? (
              <Skeleton className="m-5 h-40" />
            ) : visibleEvents.length === 0 ? (
              <EmptyState title="검수 기록이 없습니다." />
            ) : (
              <ol className="px-5 py-2">
                {visibleEvents.map((event) => {
                  const isOpen = openKeys.includes(event.key);
                  return (
                    <li key={event.key} className="flex gap-3.5 border-b border-border-main py-3.5 last:border-b-0">
                      <div className="w-21 shrink-0 text-right">
                        <p className="title-6 tabular-nums text-font-1">{toKst(event.at).format("HH:mm")}</p>
                        <p className="body-6 text-font-2">{toKst(event.at).format("MM.DD")}</p>
                      </div>
                      <div className="flex flex-col items-center pt-1">
                        <span aria-hidden className={cn("size-2.5 rounded-full ring-4 ring-surface", DOT_CLASS[event.kindTone])} />
                        <span aria-hidden className="mt-1 w-0.5 flex-1 bg-border-main" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => toggleOpen(event.key)}
                          className="flex w-full items-start gap-2 text-left"
                        >
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                            <Badge
                              tone={event.kindTone === "dark" ? "neutral" : event.kindTone}
                              className={cn(event.kindTone === "dark" && "bg-font-1 text-surface")}
                            >
                              {event.kind}
                            </Badge>
                            <Badge tone={event.group === "file" ? "info" : "neutral"}>{event.target}</Badge>
                            <span className="title-5 text-font-1">{event.title}</span>
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn("mt-1 shrink-0 text-font-2 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                        {/* 접으면 사유를 한 줄로, 펼치면 같은 자리에서 전문으로 보여 준다. 아래 상자에 다시 싣지 않는다. */}
                        {event.body && !event.isIntake && (
                          <p
                            className={cn(
                              "mt-1.5 body-5 text-font-1",
                              isOpen ? "whitespace-pre-wrap wrap-anywhere" : "truncate",
                            )}
                          >
                            {event.body}
                          </p>
                        )}
                        {isOpen && (
                          <div className="mt-2 overflow-hidden rounded-field border border-border-main">
                            {!event.isIntake &&
                              event.task.findings.map((finding, index) => (
                                <div
                                  key={index}
                                  className="border-b border-border-main bg-warning-bg px-3 py-2.5 body-5 text-font-1"
                                >
                                  <strong className="font-semibold">
                                    수정 안내 · {FINDING_FIELD_LABEL[finding.field] ?? finding.field}
                                  </strong>{" "}
                                  — {finding.guide}
                                </div>
                              ))}
                            {event.attempts.map((attempt) => (
                              <div
                                key={attempt.attemptId}
                                className="flex flex-wrap gap-x-3.5 gap-y-1 border-b border-border-main px-3 py-2 body-6 text-font-2"
                              >
                                <span className="font-semibold tabular-nums text-font-1">시도 {attempt.attempt}</span>
                                <span className="tabular-nums">{formatDateTimeSecond(attempt.startedAt)}</span>
                                {attempt.outcome === "FAILED" ? (
                                  <>
                                    <span className="font-semibold text-danger">{attemptErrorLabel(attempt.errorCode)}</span>
                                    <span className="font-mono">{attempt.errorCode}</span>
                                  </>
                                ) : (
                                  <span className="font-semibold text-font-1">{ATTEMPT_OUTCOME_LABEL[attempt.outcome]}</span>
                                )}
                                <span className="tabular-nums">{formatDurationMs(attempt.durationMs)}</span>
                                <span className="font-mono">{attempt.instanceId}</span>
                              </div>
                            ))}
                            <p className="px-3 py-2 body-6 text-font-2">
                              작업 <span className="font-mono">{event.task.taskId}</span>
                              {event.task.reasonCode && ` · ${event.task.reasonCode}`}
                              {!event.isIntake && event.task.model && ` · ${event.task.model}`}
                              {!event.isIntake && event.task.policyVersion !== null && ` · 정책 v${event.task.policyVersion}`}
                              {event.task.supersededAt && ` · ${formatDateTime(event.task.supersededAt)}에 대체됨`}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Card noPadding title="현재 상태">
            <div className="flex items-center gap-3 px-5 pt-4">
              {profileImage ? (
                <EntityImage src={profileImage.originalUrl} alt="대표 이미지" fileId={profileImage.fileId} className="w-14 shrink-0" />
              ) : (
                <span aria-hidden className="size-14 shrink-0 rounded-field bg-subtle" />
              )}
              <p className="min-w-0 truncate title-5 text-font-1">{title}</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 px-5 py-4 body-5">
              <dt className="text-font-2">검수</dt>
              <dd className="text-right">
                {statusBadge ? <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge> : <span className="text-font-2">작업 없음(기존 승인 유지)</span>}
              </dd>
              <dt className="text-font-2">공개 범위</dt>
              <dd className="text-right font-semibold text-font-1">
                {detail ? UNIVERSE_VISIBILITY_LABEL[detail.visibility] : "-"}
              </dd>
              <dt className="text-font-2">운영 제한</dt>
              <dd className="text-right">
                {detail ? (
                  <Badge tone={detail.moderationStatus === "BLOCKED" ? "danger" : "neutral"}>
                    {detail.moderationStatus === "BLOCKED" ? "제한됨" : "없음"}
                  </Badge>
                ) : (
                  "-"
                )}
              </dd>
              <dt className="text-font-2">사용자 노출</dt>
              <dd className={cn("text-right font-semibold", isExposed ? "text-success" : "text-danger")}>
                {detail ? (isExposed ? "노출 중" : "숨김") : "-"}
              </dd>
              <dt className="text-font-2">성인 설정</dt>
              <dd className="text-right font-semibold text-font-1">
                {currentUniverseTask ? (isAdultInput(currentUniverseTask) ? "켜짐" : "꺼짐") : detail?.isAdult ? "켜짐" : "꺼짐"}
              </dd>
            </dl>
          </Card>

          <ImageTaskList tasks={imageTasks} />

          <Card title="누적">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="검수 접수" value={tasks.filter((task) => task.targetType === "UNIVERSE").length} />
              <Stat label="AI 호출" value={attempts.length} />
              <Stat label="관리자 판정" value={events.filter((event) => event.group === "admin").length} />
              <Stat label="실패 시도" value={attempts.filter((attempt) => attempt.outcome === "FAILED").length} danger />
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
};

export default UniverseReviewHistory;
