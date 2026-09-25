"use client";

import { useServerInstanceRestartMutation } from "@/api/ops/mutateServerInstance";
import { useHasPermission } from "@/store/useAdminStore";
import { Refresh } from "@/icons";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { cn, formatBytes } from "@/lib/utils";
import type {
  InstancePhase,
  InstanceStatus,
  ServiceStatus,
} from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { openConfirm } from "@/store/useConfirmStore";
import {
  HEALTH_STATUS_TONE,
  USAGE_TONE_COLOR,
  USAGE_TONE_TEXT_CLASS,
  formatUptime,
  getServiceLabel,
  getUsageTone,
} from "@/app/(admin)/ops/server/_constants/serverStatus";

interface ServiceStatusCardProps {
  services: ServiceStatus[];
  isLoading: boolean;
  isError: boolean;
  selectedApp: string;
  onSelect: (app: string) => void;
}

/** 서비스 배지는 "정상/장애"보다 대수가 먼저 읽혀야 한다. 일부만 죽은 것을 한눈에 가른다. */
const SERVICE_STATUS_LABEL: Record<ServiceStatus["status"], string> = {
  UP: "정상",
  DEGRADED: "일부 응답 없음",
  DOWN: "응답 없음",
};

/** 재시작과 관련된 단계. 계획된 중단이라 장애와 다르게 보여 준다. */
export const isRestartPhase = (phase: InstancePhase) =>
  phase === "RESTART_REQUESTED" || phase === "RESTARTING";

/** 멈춰 있는 인스턴스의 안내. 다시 뜨는 중인지, 꺼져 있는지, 알리지도 못하고 끊겼는지가 다르다. */
const STOPPED_PHASE_TEXT: Partial<
  Record<InstancePhase, { title: string; description: string; tone: string }>
> = {
  RESTARTING: {
    title: "재시작 중",
    description: "요청대로 내려갔습니다. 보통 1분 안팎으로 다시 뜹니다.",
    tone: "text-warning",
  },
  STOPPED: {
    title: "종료됨",
    description:
      "정상 종료를 알렸습니다. 배포 중이면 곧 돌아오고, 계속 이 상태면 컨테이너가 꺼져 있습니다.",
    tone: "text-danger",
  },
  NO_RESPONSE: {
    title: "응답 없음",
    description: "30초 넘게 알림이 없습니다. 강제로 꺼졌거나 먹통입니다.",
    tone: "text-danger",
  },
};

/** 서비스 배지. 재시작 중인 인스턴스가 있으면 "장애"보다 그 사실을 먼저 보여 준다. */
const getServiceBadge = (
  service: ServiceStatus,
): { label: string; tone: BadgeTone } => {
  const isRestarting = service.instances.some((instance) =>
    isRestartPhase(instance.phase),
  );

  if (isRestarting) return { label: "재시작 중", tone: "warning" };

  return {
    label: SERVICE_STATUS_LABEL[service.status],
    tone: HEALTH_STATUS_TONE[service.status],
  };
};

/**
 * 수치 한 줄. 카드 안에서 가장 먼저 읽혀야 하는 값이라 퍼센트를 크게 두고,
 * 절대량은 한 단계 낮춰 아래에 둔다. 막대는 얇게 — 칸을 나누는 선이 아니라 눈금이다.
 */
const Meter = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) => {
  const tone = getUsageTone(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="body-6 text-font-2">{label}</span>
        <span
          className={cn(
            "title-3 font-bold tabular-nums",
            USAGE_TONE_TEXT_CLASS[tone],
          )}
        >
          {value.toFixed(1)}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 w-full overflow-hidden rounded-full bg-subtle"
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: USAGE_TONE_COLOR[tone],
          }}
        />
      </div>
      <span className="body-6 text-font-disabled tabular-nums">{detail}</span>
    </div>
  );
};

interface InstanceBlockProps {
  instance: InstanceStatus;
  /** 재시작 버튼. 권한이 없거나 응답하지 않는 인스턴스면 주지 않는다. */
  onRestart?: () => void;
  /** 여러 대일 때만 이름을 적는다. 한 대면 서비스 이름으로 충분해 자리만 차지한다. */
  showId: boolean;
}

/** 인스턴스 한 대. 박스로 감싸지 않는다 — 여러 대일 때만 구분선으로 나눈다. */
const InstanceBlock = ({ instance, onRestart, showId }: InstanceBlockProps) => {
  const stopped = STOPPED_PHASE_TEXT[instance.phase];

  if (stopped) {
    /* 멈춘 인스턴스의 수치는 마지막 알림 시점의 값이라 지금 값처럼 보이면 안 된다. */
    return (
      <div className="flex flex-col gap-1">
        <p className={cn("body-4 font-bold", stopped.tone)}>
          {stopped.title}
        </p>
        <p className="body-6 text-font-2">{stopped.description}</p>
        <p className="body-6 text-font-disabled">
          <code>{instance.instanceId}</code> · 마지막 알림{" "}
          {formatDateTimeSecond(instance.reportedAt)}
        </p>
      </div>
    );
  }

  const hasContainer =
    instance.containerMemoryUsage !== null &&
    instance.containerMemoryUsedBytes !== null &&
    instance.containerMemoryLimitBytes !== null;

  return (
    <div className="flex flex-col gap-3">
      {/* heapUsage의 분모는 서버가 상한(-Xmx)으로 준다. committed 대비는 평소에도 90% 안팎이다. */}
      <Meter
        label="JVM 힙 (상한 대비)"
        value={instance.heapUsage}
        detail={`${formatBytes(instance.heapUsedBytes)} / 상한 ${formatBytes(instance.heapMaxBytes)} · 확보 ${formatBytes(instance.heapCommittedBytes)}`}
      />

      {hasContainer ? (
        <Meter
          label="컨테이너 메모리"
          value={instance.containerMemoryUsage as number}
          detail={`${formatBytes(instance.containerMemoryUsedBytes as number)} / ${formatBytes(instance.containerMemoryLimitBytes as number)} · 넘으면 OOMKilled`}
        />
      ) : (
        <span className="body-6 text-font-disabled">
          컨테이너 한도 없음 (로컬 실행)
        </span>
      )}

      {/* 부가 정보는 한 줄로 흐리게. 식별자 · CPU · 업타임은 찾을 때만 본다. */}
      <div className="flex items-center justify-between gap-2">
        <span
          title={[instance.instanceId, instance.jvmOptions]
            .filter(Boolean)
            .join("\n")}
          className="min-w-0 truncate body-6 text-font-2"
        >
          {showId && <code>{instance.instanceId} · </code>}
          CPU {instance.cpuUsage.toFixed(1)}% · 업타임{" "}
          {formatUptime(instance.uptimeSeconds)}
        </span>

        {instance.phase === "RESTART_REQUESTED" ? (
          <span className="shrink-0 body-6 font-medium text-warning">
            재시작 요청됨
          </span>
        ) : onRestart && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Refresh size={13} />}
            className="-mr-2 shrink-0"
            onClick={(event) => {
              /* 카드 선택(추이 전환)으로 번지지 않게 막는다. */
              event.stopPropagation();
              onRestart();
            }}
          >
            재시작
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * 서비스별 상태.
 *
 * 위쪽 호스트 카드들은 "이 서버 한 대"를 보고, 여기는 **그 위에서 도는 앱들**을
 * 본다. 앱마다 JVM · 컨테이너 한도가 따로라 힙이 찬 앱, OOMKilled에 가까운 앱은
 * 여기서만 갈린다. 서비스를 누르면 아래 추이가 그 서비스로 바뀐다.
 */
const ServiceStatusCard = ({
  services,
  isLoading,
  isError,
  selectedApp,
  onSelect,
}: ServiceStatusCardProps) => {
  const canRestart = useHasPermission("server:write");
  const restartMutation = useServerInstanceRestartMutation();

  const handleRestart = (service: ServiceStatus, instance: InstanceStatus) => {
    const label = `${getServiceLabel(service.app)}(${instance.instanceId})`;
    const isOnlyInstance =
      service.instances.filter((candidate) => candidate.status === "UP")
        .length <= 1;

    openConfirm({
      title: `${label}을(를) 재시작할까요?`,
      description:
        "진행 중인 요청을 마무리한 뒤 내려가고, 컨테이너가 다시 띄웁니다. 보통 1분 안팎입니다.",
      warning: isOnlyInstance
        ? `이 서비스의 유일한 인스턴스입니다. 다시 뜰 때까지 ${getServiceLabel(service.app)} 요청이 모두 끊깁니다.${
            service.app === "admin" ? " 이 화면도 잠시 끊겼다가 돌아옵니다." : ""
          }`
        : undefined,
      confirmText: "재시작",
      tone: "danger",
      onConfirm: () =>
        restartMutation.mutateAsync({
          app: service.app,
          instanceId: instance.instanceId,
          label,
        }),
    });
  };

  return (
    <Card
      id="server-services"
      title="서비스별 상태"
      description="각 앱이 10초마다 알린 상태입니다. 30초 넘게 알림이 없으면 응답 없음으로 봅니다. 서비스를 누르면 아래 추이가 바뀝니다."
    >
      {isError ? (
        <Alert tone="danger" title="서비스 상태를 불러오지 못했습니다.">
          새로고침을 다시 눌러 주세요. 호스트 상태는 위 카드에서 계속 볼 수
          있습니다.
        </Alert>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const isSelected = service.app === selectedApp;

            return (
              /*
                안에 재시작 버튼이 있어 카드를 <button>으로 둘 수 없다(버튼 중첩).
                키보드로도 고를 수 있게 역할과 키 처리를 직접 붙인다.
              */
              <div
                key={service.app}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelect(service.app)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(service.app);
                  }
                }}
                className={cn(
                  "flex cursor-pointer flex-col gap-4 rounded-card border p-4 text-left transition",
                  isSelected
                    ? "border-brand bg-brand/[0.03]"
                    : "border-border-main hover:border-border-strong",
                  service.status === "DOWN" && !isSelected && "border-danger/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="body-3 font-bold text-font-0">
                      {getServiceLabel(service.app)}
                    </span>
                    <span className="truncate body-6 text-font-2">
                      {service.domain ?? "내부 전용"}
                    </span>
                  </div>
                  <Badge tone={getServiceBadge(service).tone}>
                    {getServiceBadge(service).label}
                  </Badge>
                </div>

                {service.instances.length === 0 ? (
                  <p className="body-6 text-font-2">
                    알림이 한 번도 없습니다. 컨테이너가 떠 있는지 확인해 주세요.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-border-main">
                    {service.instances.map((instance) => (
                      <div
                        key={instance.instanceId}
                        className="py-3 first:pt-0 last:pb-0"
                      >
                        <InstanceBlock
                          instance={instance}
                          showId={service.instances.length > 1}
                          onRestart={
                            canRestart && instance.phase === "RUNNING"
                              ? () => handleRestart(service, instance)
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ServiceStatusCard;
