"use client";

import { formatDateTimeSecond } from "@/lib/dayjs";
import { cn, formatBytes } from "@/lib/utils";
import type { InstanceStatus, ServiceStatus } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import UsageBar from "./UsageBar";
import {
  HEALTH_STATUS_TONE,
  formatUptime,
  getServiceLabel,
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

const InstanceRow = ({ instance }: { instance: InstanceStatus }) => {
  const isDown = instance.status === "DOWN";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-field border border-border-main px-3.5 py-3",
        isDown && "border-danger/40 bg-danger/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <code className="truncate body-6 font-medium text-font-1">
          {instance.instanceId}
        </code>
        {isDown && <Badge tone="danger">응답 없음</Badge>}
      </div>

      {isDown ? (
        /* 끊긴 인스턴스의 수치는 마지막 알림 시점의 값이라 지금 값처럼 보이면 안 된다. */
        <p className="body-6 text-font-2">
          마지막 알림 {formatDateTimeSecond(instance.reportedAt)} — 컨테이너가
          재시작 중이거나 멈췄습니다.
        </p>
      ) : (
        <>
          <UsageBar
            isCompact
            label="JVM 힙"
            value={instance.heapUsage}
            description={`${formatBytes(instance.heapUsedBytes)} / ${formatBytes(
              instance.heapCommittedBytes,
            )} · 상한 ${formatBytes(instance.heapMaxBytes)}`}
          />

          {instance.containerMemoryUsage !== null &&
          instance.containerMemoryUsedBytes !== null &&
          instance.containerMemoryLimitBytes !== null ? (
            <UsageBar
              isCompact
              label="컨테이너 메모리"
              value={instance.containerMemoryUsage}
              description={`${formatBytes(instance.containerMemoryUsedBytes)} / ${formatBytes(
                instance.containerMemoryLimitBytes,
              )} · 넘으면 OOMKilled`}
            />
          ) : (
            <p className="body-6 text-font-disabled">
              컨테이너 한도 없음 (로컬 실행)
            </p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 body-6 text-font-2">
            <span className="tabular-nums">
              CPU {instance.cpuUsage.toFixed(1)}%
            </span>
            <span>업타임 {formatUptime(instance.uptimeSeconds)}</span>
          </div>
        </>
      )}

      {instance.jvmOptions && (
        <code
          title={instance.jvmOptions}
          className="truncate body-6 text-font-2"
        >
          {instance.jvmOptions}
        </code>
      )}
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
            <Skeleton key={index} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const isSelected = service.app === selectedApp;

            return (
              <button
                key={service.app}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(service.app)}
                className={cn(
                  "flex flex-col gap-3 rounded-card border p-4 text-left transition",
                  isSelected
                    ? "border-brand ring-1 ring-brand"
                    : "border-border-main hover:border-border-strong",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="body-3 font-bold text-font-0">
                      {getServiceLabel(service.app)}
                    </span>
                    <span className="truncate body-6 text-font-2">
                      {service.domain ?? "외부 주소 없음 (내부 전용)"}
                    </span>
                  </div>
                  <Badge tone={HEALTH_STATUS_TONE[service.status]}>
                    {SERVICE_STATUS_LABEL[service.status]}
                  </Badge>
                </div>

                {service.instances.length === 0 ? (
                  <p className="body-6 text-font-2">
                    알림이 한 번도 없습니다. 컨테이너가 떠 있는지 확인해 주세요.
                  </p>
                ) : (
                  service.instances.map((instance) => (
                    <InstanceRow key={instance.instanceId} instance={instance} />
                  ))
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ServiceStatusCard;
