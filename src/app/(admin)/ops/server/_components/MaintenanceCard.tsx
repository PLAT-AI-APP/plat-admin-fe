"use client";

import { useState } from "react";
import { useMaintenanceQuery } from "@/api/ops/getMaintenance";
import { useMaintenanceMutation } from "@/api/ops/mutateMaintenance";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { MaintenancePhase, MaintenanceWindow } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import MaintenanceScheduleModal from "./MaintenanceScheduleModal";
import { getServiceLabel } from "@/app/(admin)/ops/server/_constants/serverStatus";

const PHASE_BADGE: Record<
  MaintenancePhase,
  { label: string; tone: BadgeTone }
> = {
  OPEN: { label: "종료", tone: "neutral" },
  NOTICE: { label: "예고 중", tone: "info" },
  DRAINING: { label: "소프트 종료 중", tone: "warning" },
  CLOSED: { label: "점검 중", tone: "danger" },
};

const PHASE_DESCRIPTION: Record<MaintenancePhase, string> = {
  OPEN: "",
  NOTICE: "모든 요청이 통과합니다. 사용자 화면에 점검 예고가 뜹니다.",
  DRAINING:
    "새 요청(채팅 시작 · 결제 시작 등)은 막고, 이미 시작한 결제 승인 · 채팅 답변은 끝까지 처리합니다. 아래 진행 중 수가 0 이 되면 닫아도 안전합니다.",
  CLOSED:
    "헬스 체크 · 점검 상태 · PG 웹훅 말고 사용자 요청이 모두 막혀 있습니다. 배포 · DB 작업을 하고 끝내기를 누르세요.",
};

const STATUS_LABEL: Record<MaintenanceWindow["status"], string> = {
  SCHEDULED: "예약",
  CANCELLED: "취소",
  FINISHED: "종료",
};

/**
 * 점검 예약과 소프트 종료.
 *
 * 예약은 api · ai 인스턴스가 3초마다 읽어 시각대로 요청을 거른다. 인스턴스별 진행 중 요청 · 답변 생성 수와
 * 승인 전 결제 수를 함께 보여 줘 "지금 닫아도 되나"를 한 화면에서 가른다.
 */
const MaintenanceCard = () => {
  const canWrite = useHasPermission("server:write");
  const { data, isLoading, isError } = useMaintenanceQuery();
  const { scheduleMutation, actionMutation } = useMaintenanceMutation();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const current = data?.current ?? null;
  const busyInstances = (data?.instances ?? []).filter(
    (instance) =>
      (instance.inFlightRequests ?? 0) > 0 ||
      (instance.activeGenerations ?? 0) > 0,
  );

  const runAction = (
    window: MaintenanceWindow,
    action: "close" | "cancel" | "finish",
  ) => {
    const confirmByAction = {
      close: {
        title: "지금 점검을 시작할까요?",
        description:
          "사용자 요청이 곧바로 모두 막힙니다. 이미 서버에 들어온 요청은 끝까지 처리됩니다.",
        warning:
          busyInstances.length > 0 || (data?.pendingCheckouts ?? 0) > 0
            ? `진행 중인 요청 · 답변 생성 또는 승인 전 결제 ${data?.pendingCheckouts ?? 0}건이 남아 있습니다. 결제 승인 전에 닫히면 그 사람은 결제를 다시 해야 합니다.`
            : undefined,
        confirmText: "지금 시작",
        tone: "danger" as const,
      },
      cancel: {
        title: "점검 예약을 취소할까요?",
        description: "사용자 화면의 예고도 사라집니다.",
        confirmText: "예약 취소",
        tone: "default" as const,
      },
      finish: {
        title: "점검을 끝내고 서비스를 열까요?",
        description: "몇 초 안에 모든 인스턴스가 요청을 다시 받습니다.",
        confirmText: "끝내기",
        tone: "default" as const,
      },
    }[action];

    openConfirm({
      ...confirmByAction,
      onConfirm: () =>
        actionMutation.mutateAsync(
          { maintenanceId: window.maintenanceId, action },
          { onError: (error) => showErrorToast(error) },
        ),
    });
  };

  return (
    <Card
      id="server-maintenance"
      title="점검 · 소프트 종료"
      description="예고 → 소프트 종료(새 요청 차단, 진행 중인 흐름은 통과) → 점검 중(모두 차단) → 끝내기 순서로 진행합니다."
      action={
        canWrite && !current ? (
          <Button variant="primary" onClick={() => setIsScheduleOpen(true)}>
            점검 예약
          </Button>
        ) : undefined
      }
    >
      {isError ? (
        <Alert tone="danger" title="점검 현황을 불러오지 못했습니다.">
          새로고침을 다시 눌러 주세요.
        </Alert>
      ) : isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="flex flex-col gap-5">
          {current ? (
            <div className="rounded-lg border border-border-main p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={PHASE_BADGE[current.phase].tone}>
                  {PHASE_BADGE[current.phase].label}
                </Badge>
                <span className="body-5 text-font-2">
                  예약자 {current.createdByName}
                </span>
              </div>
              <p className="mt-2 body-4 text-font-1">
                {PHASE_DESCRIPTION[current.phase]}
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-2 body-5 sm:grid-cols-3">
                <div>
                  <dt className="text-font-2">소프트 종료 시작</dt>
                  <dd className="tabular-nums text-font-1">
                    {formatDateTime(current.drainStartsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-font-2">점검 시작(완전 종료)</dt>
                  <dd className="tabular-nums text-font-1">
                    {formatDateTime(current.closesAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-font-2">예상 종료(안내)</dt>
                  <dd className="tabular-nums text-font-1">
                    {current.expectedEndsAt
                      ? formatDateTime(current.expectedEndsAt)
                      : "-"}
                  </dd>
                </div>
              </dl>
              {current.message && (
                <p className="mt-3 body-5 text-font-2">
                  안내 문구: {current.message}
                </p>
              )}
              {canWrite && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(current.phase === "NOTICE" ||
                    current.phase === "DRAINING") && (
                    <Button
                      variant="danger"
                      onClick={() => runAction(current, "close")}
                    >
                      지금 점검 시작
                    </Button>
                  )}
                  {current.phase === "NOTICE" && (
                    <Button
                      variant="secondary"
                      onClick={() => runAction(current, "cancel")}
                    >
                      예약 취소
                    </Button>
                  )}
                  {(current.phase === "DRAINING" ||
                    current.phase === "CLOSED") && (
                    <Button
                      variant="primary"
                      onClick={() => runAction(current, "finish")}
                    >
                      점검 끝내기
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="body-4 text-font-2">예약된 점검이 없습니다.</p>
          )}

          <div>
            <p className="body-4 font-medium text-font-1">지금 처리 중인 일</p>
            <p className="mt-0.5 body-6 text-font-2">
              인스턴스가 10초마다 알린 값입니다.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {data.instances.map((instance) => (
                <div
                  key={`${instance.app}-${instance.instanceId}`}
                  className="flex items-center justify-between rounded-md bg-surface-hover px-3 py-2 body-5"
                >
                  <span className="text-font-1">
                    {getServiceLabel(instance.app)}{" "}
                    <span className="text-font-2">({instance.instanceId})</span>
                  </span>
                  <span className="tabular-nums text-font-1">
                    {instance.inFlightRequests === null
                      ? "응답 없음"
                      : `요청 ${instance.inFlightRequests}${
                          instance.activeGenerations === null
                            ? ""
                            : ` · 답변 생성 ${instance.activeGenerations}`
                        }`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 body-5 text-font-2">
              승인 전 결제 {data.pendingCheckouts}건
              {data.latestCheckoutExpiresAt
                ? ` — ${formatDateTime(data.latestCheckoutExpiresAt)}까지 기다리면 모두 끝나거나 만료됩니다.`
                : ""}
            </p>
          </div>

          {data.history.length > 0 && (
            <div>
              <p className="body-4 font-medium text-font-1">최근 점검</p>
              <ul className="mt-2 flex flex-col gap-1 body-5 text-font-2">
                {data.history.slice(0, 5).map((window) => (
                  <li key={window.maintenanceId} className="tabular-nums">
                    {formatDateTime(window.drainStartsAt)} ·{" "}
                    {STATUS_LABEL[window.status]} · {window.createdByName}
                    {window.endedByName ? ` → ${window.endedByName}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <MaintenanceScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        isSubmitting={scheduleMutation.isPending}
        onSubmit={(payload) =>
          scheduleMutation.mutate(payload, {
            onSuccess: () => setIsScheduleOpen(false),
            onError: (error) => showErrorToast(error),
          })
        }
      />
    </Card>
  );
};

export default MaintenanceCard;
