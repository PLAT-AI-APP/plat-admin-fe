"use client";

import Link from "next/link";
import { useServerInstanceRestartMutation } from "@/api/ops/mutateServerInstance";
import { openConfirm } from "@/store/useConfirmStore";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { getServiceLabel } from "../../server/_constants/serverStatus";
import type { SecretItem } from "@/type/secret";
import type { StaleInstance } from "./restartStatus";

/** 이름 둘까지 보이고 나머지는 개수로. 전체는 마우스를 올리면 보인다. */
const summarize = (secrets: SecretItem[]) =>
  secrets.length > 2
    ? `${secrets
        .slice(0, 2)
        .map((secret) => secret.label)
        .join(", ")} 외 ${secrets.length - 2}개`
    : secrets.map((secret) => secret.label).join(", ");

interface SecretRestartPanelProps {
  staleInstances: StaleInstance[];
  restartingApps: string[];
  canRestart: boolean;
}

/**
 * 바뀐 시크릿을 아직 읽지 않은 서버와 그 자리의 재시작 버튼. 재시작은 서버 상태 화면과 같은 요청이다 — 앱이 스스로 정상 종료하고
 * 컨테이너가 다시 띄운다. 한 대뿐인 서비스는 그동안 끊기므로 확인을 받는다.
 */
const SecretRestartPanel = ({
  staleInstances,
  restartingApps,
  canRestart,
}: SecretRestartPanelProps) => {
  const restartMutation = useServerInstanceRestartMutation();

  if (staleInstances.length === 0 && restartingApps.length === 0) return null;

  const handleRestart = ({ app, instance, secrets }: StaleInstance) => {
    const label = getServiceLabel(app);
    openConfirm({
      title: `${label}을(를) 재시작할까요?`,
      description: `바뀐 시크릿(${summarize(secrets)})의 새 값을 읽습니다.`,
      warning: `다시 뜨는 1분 안팎 동안 ${label} 요청이 끊깁니다.${
        app === "admin" ? " 이 관리자 화면도 잠깐 응답하지 않습니다." : ""
      }`,
      confirmText: "재시작",
      tone: "danger",
      onConfirm: () =>
        restartMutation.mutateAsync({
          app,
          instanceId: instance.instanceId,
          label,
        }),
    });
  };

  return (
    <Alert
      tone="warning"
      title={
        staleInstances.length > 0
          ? "바뀐 값을 아직 읽지 않은 서버가 있습니다"
          : "서버가 다시 뜨는 중입니다"
      }
    >
      <div className="flex flex-col gap-2">
        {staleInstances.map((stale) => (
          <div
            key={`${stale.app}/${stale.instance.instanceId}`}
            className="flex items-center justify-between gap-3"
          >
            <span
              className="body-5 min-w-0 flex-1"
              title={stale.secrets.map((secret) => secret.label).join(", ")}
            >
              <span className="font-semibold">
                {getServiceLabel(stale.app)}
              </span>
              {staleInstances.filter((other) => other.app === stale.app)
                .length > 1 && (
                <span className="ml-1 text-font-2">
                  ({stale.instance.instanceId})
                </span>
              )}
              <span className="text-font-2">
                {" "}
                · 바뀐 시크릿 {summarize(stale.secrets)}
              </span>
            </span>
            {canRestart && (
              <Button
                size="sm"
                variant="secondary"
                disabled={restartMutation.isPending}
                onClick={() => handleRestart(stale)}
              >
                재시작
              </Button>
            )}
          </div>
        ))}
        {restartingApps.length > 0 && (
          <span className="body-6 text-font-2">
            재시작 중: {restartingApps.map(getServiceLabel).join(" · ")}
          </span>
        )}
        <Link href="/ops/server" className="body-6 underline">
          서버 상태에서 자세히 보기
        </Link>
      </div>
    </Alert>
  );
};

export default SecretRestartPanel;
