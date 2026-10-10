"use client";

import Link from "next/link";
import { useState } from "react";
import { useSecretsQuery } from "@/api/ops/getSecrets";
import { useSecretMutation } from "@/api/ops/mutateSecret";
import { daysLeftKst, formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import { SECRET_GRADE_LABEL, type SecretItem } from "@/type/secret";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import SecretSaveModal from "./SecretSaveModal";

const EXPIRY_ALERT_DAYS = 7;

const ExpiryBadge = ({ expiresOn }: { expiresOn: string | null }) => {
  if (!expiresOn) return null;
  const days = daysLeftKst(expiresOn);
  if (days < 0) return <Badge tone="danger">만료됨</Badge>;
  if (days <= EXPIRY_ALERT_DAYS) return <Badge tone="warning">D-{days}</Badge>;
  return null;
};

/** AWS 주체 ARN 에서 사람이 읽을 이름만. user/plat-admin → plat-admin, assumed-role/역할/세션 → 역할/세션. */
const principalName = (arn: string | null) => {
  if (!arn) return "";
  const resource = arn.slice(arn.lastIndexOf(":") + 1);
  return resource.replace(/^(user|assumed-role|role)\//, "");
};

/**
 * 시크릿 목록. 값은 서버도 읽지 않는다 — 저장소의 버전 · 수정 시각과 관리자 화면에서 넣은 값의 끝 4자리만 보인다.
 * 바꾼 값은 앱이 기동할 때 읽으므로, 저장 뒤 안내된 서버를 서버 상태 화면에서 다시 띄운다.
 */
const SecretManager = () => {
  const canWrite = useHasPermission("server:write");
  const { data, isLoading, isError } = useSecretsQuery();
  const { saveMutation, restoreMutation } = useSecretMutation();
  const [target, setTarget] = useState<SecretItem | null>(null);
  const [pendingRestart, setPendingRestart] = useState<string[]>([]);

  const handleSave = (input: {
    secretValue: string | null;
    expiresOn: string | null;
    memo: string | null;
  }) => {
    if (!target) return;
    const { name, restartApps } = target;
    saveMutation.mutate(
      { name, ...input },
      {
        onSuccess: () => {
          setTarget(null);
          if (input.secretValue !== null) {
            markRestart(restartApps);
            showAppToast(
              "success",
              `저장했습니다. ${restartApps.join(" · ")} 를 다시 띄워야 반영됩니다.`,
            );
          } else {
            showAppToast("success", "저장했습니다.");
          }
        },
      },
    );
  };

  const markRestart = (apps: string[]) =>
    setPendingRestart((previous) =>
      Array.from(new Set([...previous, ...apps])),
    );

  const handleRestore = (secret: SecretItem) =>
    openConfirm({
      title: `${secret.label}을(를) 이전 값으로 되돌릴까요?`,
      description: `v${(secret.version ?? 1) - 1} 의 값을 새 버전으로 다시 씁니다. 다시 누르면 지금 값으로 돌아갑니다. 반영하려면 ${secret.restartApps.join(" · ")} 를 다시 띄워야 합니다.`,
      confirmText: "되돌리기",
      tone: "danger",
      onConfirm: () =>
        restoreMutation.mutateAsync(secret.name).then(() => {
          markRestart(secret.restartApps);
          showAppToast(
            "success",
            `되돌렸습니다. ${secret.restartApps.join(" · ")} 를 다시 띄워야 반영됩니다.`,
          );
        }),
    });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) {
    return <Alert tone="danger" title="시크릿 목록을 불러오지 못했습니다" />;
  }

  const missing = data.secrets.filter((secret) => !secret.registered);
  const editable = canWrite && !data.readOnly;

  return (
    <div className="flex flex-col gap-5">
      {pendingRestart.length > 0 && (
        <Alert tone="warning" title="재시작이 필요합니다">
          바꾼 값은 {pendingRestart.join(" · ")} 를 다시 띄워야 반영됩니다.{" "}
          <Link href="/ops/server" className="underline">
            서버 상태에서 재시작하기
          </Link>
        </Alert>
      )}
      {missing.length > 0 && !data.readOnly && (
        <Alert tone="danger" title="저장소에 없는 시크릿이 있습니다">
          {missing.map((secret) => secret.label).join(", ")} — 이대로 다시
          띄우면 서버가 뜨지 않습니다.
        </Alert>
      )}
      {data.readOnly && (
        <Alert tone="info" title="이 환경에서는 바꿀 수 없습니다">
          로컬은 읽기만 합니다. 바꾸려면 dev 관리자 화면을 쓰세요.
        </Alert>
      )}

      <Card
        title="시크릿"
        description={`AWS Parameter Store ${data.path}`}
        noPadding
      >
        {data.secrets.map((secret) => (
          <div
            key={secret.name}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border-main px-5 py-3 first:border-t-0"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="body-5 font-semibold">{secret.label}</span>
                <Badge
                  tone={secret.grade === "CRITICAL" ? "danger" : "warning"}
                >
                  {SECRET_GRADE_LABEL[secret.grade]}
                </Badge>
                {secret.lockedReason && <Badge tone="neutral">잠금</Badge>}
                {!secret.registered && <Badge tone="danger">없음</Badge>}
                <ExpiryBadge expiresOn={secret.expiresOn} />
              </div>
              <span className="body-7 font-mono text-font-2">
                {secret.name}
                {secret.valueHint ? ` · ${secret.valueHint}` : ""}
              </span>
              <span className="body-7 text-font-2">
                {secret.registered
                  ? [
                      `v${secret.version}`,
                      `${formatDateTime(secret.lastModifiedAt)} ${principalName(secret.lastModifiedBy)}`,
                      secret.valueUpdatedBy
                        ? `화면에서 ${secret.valueUpdatedBy} (${formatDateTime(secret.valueUpdatedAt)})`
                        : null,
                      secret.expiresOn ? `만료 ${secret.expiresOn}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "저장소에 없습니다."}
              </span>
              <span className="body-7 text-font-2">
                바꾸면 재시작: {secret.restartApps.join(" · ")}
                {secret.lockedReason ? ` · ${secret.lockedReason}` : ""}
              </span>
              {secret.memo && (
                <span className="body-7 text-font-1">{secret.memo}</span>
              )}
            </div>
            {editable && (
              <div className="flex gap-2">
                {!secret.lockedReason && (secret.version ?? 0) > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={restoreMutation.isPending}
                    onClick={() => handleRestore(secret)}
                  >
                    되돌리기
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setTarget(secret)}
                >
                  {secret.lockedReason ? "정보 수정" : "변경"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </Card>

      <SecretSaveModal
        key={target?.name ?? "closed"}
        target={target}
        isSubmitting={saveMutation.isPending}
        onClose={() => setTarget(null)}
        onSubmit={handleSave}
      />
    </div>
  );
};

export default SecretManager;
