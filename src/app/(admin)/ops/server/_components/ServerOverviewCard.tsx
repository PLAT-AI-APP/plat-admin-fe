"use client";

import { Copy, Refresh } from "@/icons";
import { formatDateTimeSecond } from "@/lib/dayjs";
import { showAppToast, showErrorToast } from "@/lib/toast";
import type { ServerHealth } from "@/type/ops";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import {
  AUTO_REFRESH_LABEL,
  AUTO_REFRESH_SECONDS,
  type AutoRefreshSeconds,
} from "../_hooks/useAutoRefresh";
import {
  HEALTH_STATUS_DESCRIPTION,
  HEALTH_STATUS_LABEL,
  HEALTH_STATUS_TONE,
  formatUptime,
} from "../_constants/serverStatus";

interface ServerOverviewCardProps {
  health: ServerHealth;
  isRefreshing: boolean;
  onRefresh: () => void;
  autoRefreshSeconds: AutoRefreshSeconds;
  onAutoRefreshChange: (seconds: AutoRefreshSeconds) => void;
  /** 다음 자동 새로고침까지 남은 초. 0이면 표시하지 않는다. */
  secondsLeft: number;
}

const AUTO_REFRESH_OPTIONS = AUTO_REFRESH_SECONDS.map((seconds) => ({
  label: AUTO_REFRESH_LABEL[seconds],
  value: String(seconds),
}));

/** 라벨 + 값 한 줄. 서버를 특정하는 값들이라 붙여 놓고 한 번에 읽게 한다. */
const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="body-6 text-font-2">{label}</span>
    <span className="body-5 font-medium break-all text-font-1">{value}</span>
  </div>
);

/**
 * 맨 위 한 줄. "지금 정상인가"와 "어느 서버를 보고 있는가"를 먼저 답한다.
 *
 * 인스턴스 · JVM 정보를 여기 두는 이유는, 값이 이상할 때 가장 먼저 확인하는 것이
 * "내가 보는 서버가 그 서버가 맞나"이기 때문이다.
 */
const ServerOverviewCard = ({
  health,
  isRefreshing,
  onRefresh,
  autoRefreshSeconds,
  onAutoRefreshChange,
  secondsLeft,
}: ServerOverviewCardProps) => {
  /** 값이 이상할 때 관제 채널에 그대로 붙여 넣을 수 있게 스냅샷을 통째로 준다. */
  const handleCopySnapshot = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(health, null, 2));
      showAppToast("success", "현재 상태를 JSON으로 복사했습니다.");
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <Card
      title="서버 개요"
      description={`마지막 확인 ${formatDateTimeSecond(health.checkedAt)}${
        secondsLeft > 0 ? ` · ${secondsLeft}초 후 자동 새로고침` : ""
      }`}
      action={
        <div className="flex items-center gap-2">
          <Select
            aria-label="자동 새로고침 주기"
            options={AUTO_REFRESH_OPTIONS}
            value={String(autoRefreshSeconds)}
            onChange={(event) =>
              onAutoRefreshChange(
                Number(event.target.value) as AutoRefreshSeconds,
              )
            }
            selectBoxClassName="h-9 w-[168px]"
          />

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Copy size={15} />}
            onClick={handleCopySnapshot}
          >
            JSON 복사
          </Button>

          <Button
            size="sm"
            leftIcon={<Refresh size={15} />}
            isLoading={isRefreshing}
            onClick={onRefresh}
          >
            새로고침
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Badge tone={HEALTH_STATUS_TONE[health.status]}>
            {HEALTH_STATUS_LABEL[health.status]}
          </Badge>
          <span className="body-5 text-font-2">
            {HEALTH_STATUS_DESCRIPTION[health.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-main pt-5 md:grid-cols-3 xl:grid-cols-6">
          <MetaItem label="인스턴스" value={health.instanceId} />
          <MetaItem label="업타임" value={formatUptime(health.uptimeSeconds)} />
          <MetaItem
            label="기동 시각"
            value={formatDateTimeSecond(health.startedAt)}
          />
          <MetaItem label="OS" value={health.osName} />
          <MetaItem label="Java" value={health.javaVersion} />
          <MetaItem
            label="외부 의존성"
            value={`${health.dependencies.length}개 연결`}
          />
        </div>
      </div>
    </Card>
  );
};

export default ServerOverviewCard;
