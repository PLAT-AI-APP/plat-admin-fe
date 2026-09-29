"use client";

import { useState } from "react";
import { useAiKeysQuery } from "@/api/ai/getAiKeys";
import { useAiKeyMutation } from "@/api/ai/mutateAiKey";
import { daysLeftKst, formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import {
  AI_KEY_PROVIDER_LABEL,
  AI_KEY_SLOT_LABEL,
  type AiKeyCheckResult,
  type AiKeyProvider,
  type AiKeyProviderState,
  type AiKeySlot,
  type AiKeySlotState,
} from "@/type/aiKey";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import AiKeySaveModal, { type AiKeySaveTarget } from "./AiKeySaveModal";

const EXPIRY_ALERT_DAYS = 7;

type CheckResults = Partial<Record<string, AiKeyCheckResult>>;

const slotKey = (provider: AiKeyProvider, slot: AiKeySlot) =>
  `${provider}/${slot}`;

const ExpiryBadge = ({ expiresOn }: { expiresOn: string | null }) => {
  if (!expiresOn) return null;
  const days = daysLeftKst(expiresOn);
  if (days < 0) return <Badge tone="danger">만료됨</Badge>;
  if (days <= EXPIRY_ALERT_DAYS) return <Badge tone="warning">D-{days}</Badge>;
  return null;
};

/**
 * 제공사별 메인 · 서브 키.
 *
 * 메인이 요청 한도 초과 · 잔액 소진 · 키 인증 실패로 막히면 서버가 서브로 넘긴다. 요청 한도는 1분 뒤 저절로 돌아오고,
 * 나머지는 충전 · 교체 뒤 "메인 복귀"를 누르거나 5분마다 도는 자동 확인을 기다린다.
 */
const AiKeyManager = () => {
  const canWrite = useHasPermission("server:write");
  const { data, isLoading, isError } = useAiKeysQuery();
  const { saveMutation, deleteMutation, restoreMutation, checkMutation } =
    useAiKeyMutation();
  const [target, setTarget] = useState<AiKeySaveTarget | null>(null);
  const [checks, setChecks] = useState<CheckResults>({});

  const runCheck = (provider: AiKeyProvider, slot: AiKeySlot) =>
    checkMutation.mutate(
      { provider, slot },
      {
        onSuccess: (result) => {
          setChecks((previous) => ({
            ...previous,
            [slotKey(provider, slot)]: result,
          }));
          showAppToast(result.isSuccess ? "success" : "error", result.message);
        },
      },
    );

  const handleSave = (input: { apiKey: string; expiresOn: string | null }) => {
    if (!target) return;
    const { provider, slot } = target;
    saveMutation.mutate(
      { provider, slot, ...input },
      {
        onSuccess: () => {
          setTarget(null);
          showAppToast("success", "저장했습니다. 연결을 확인합니다.");
          runCheck(provider, slot);
        },
      },
    );
  };

  const handleDelete = (provider: AiKeyProvider) =>
    openConfirm({
      title: "서브 키를 지울까요?",
      description: "메인 키가 막혀도 넘어갈 곳이 없어집니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () => deleteMutation.mutateAsync({ provider, slot: "SUB" }),
    });

  const handleRestore = (provider: AiKeyProvider) =>
    openConfirm({
      title: "메인 키로 되돌릴까요?",
      description:
        "충전하거나 메인 키를 교체했을 때 누르세요. 아직 막혀 있으면 다음 요청에서 다시 서브로 넘어갑니다.",
      confirmText: "메인 복귀",
      tone: "default",
      onConfirm: () => restoreMutation.mutateAsync(provider),
    });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) {
    return <Alert tone="danger" title="키 현황을 불러오지 못했습니다" />;
  }

  const staleInstances = data.instances.filter(
    (instance) => !instance.upToDate || instance.error,
  );

  const renderSlot = (provider: AiKeyProviderState, slot: AiKeySlotState) => {
    const check = checks[slotKey(provider.provider, slot.slot)];
    const isActive = provider.activeSlot === slot.slot;
    return (
      <div
        key={slot.slot}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border-main py-3 first:border-t-0"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="body-5 font-semibold">
              {AI_KEY_SLOT_LABEL[slot.slot]}
            </span>
            {isActive && slot.registered && (
              <Badge tone="success">사용 중</Badge>
            )}
            <ExpiryBadge expiresOn={slot.expiresOn} />
          </div>
          <span className="body-6 font-mono text-font-1">
            {slot.registered ? slot.maskedKey : "등록 안 됨"}
          </span>
          <span className="body-7 text-font-2">
            {slot.registered
              ? `${slot.expiresOn ? `만료 ${slot.expiresOn} · ` : ""}${formatDateTime(slot.updatedAt)} ${slot.updatedBy ?? ""}`
              : slot.slot === "MAIN"
                ? "저장소에 없어 배포 환경 변수 키를 씁니다(있다면)."
                : "메인이 막혀도 넘어갈 곳이 없습니다."}
          </span>
          {check && (
            <span
              className={`body-7 ${check.isSuccess ? "text-success" : "text-danger"}`}
            >
              {check.isSuccess ? "연결 정상" : "연결 실패"} · {check.message} (
              {formatDateTime(check.checkedAt)})
            </span>
          )}
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {slot.registered && (
              <Button
                size="sm"
                variant="ghost"
                disabled={checkMutation.isPending}
                onClick={() => runCheck(provider.provider, slot.slot)}
              >
                연결 확인
              </Button>
            )}
            {slot.registered && slot.slot === "SUB" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(provider.provider)}
              >
                삭제
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setTarget({
                  provider: provider.provider,
                  slot: slot.slot,
                  isReplace: slot.registered,
                  expiresOn: slot.expiresOn,
                })
              }
            >
              {slot.registered ? "교체" : "등록"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {staleInstances.length > 0 && (
        <Alert tone="warning" title="아직 새 키를 읽지 않은 AI 서버가 있습니다">
          {staleInstances
            .map(
              (instance) =>
                `${instance.instanceId}${instance.error ? ` (${instance.error})` : ""}`,
            )
            .join(", ")}
          — 몇 초 뒤에 다시 확인해 주세요.
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {data.providers.map((provider) => {
          const isFallback = provider.fallbackReason !== null;
          return (
            <Card
              key={provider.provider}
              title={AI_KEY_PROVIDER_LABEL[provider.provider]}
              action={
                isFallback ? (
                  <Badge tone="warning">서브 사용 중</Badge>
                ) : (
                  <Badge tone="neutral">메인 사용 중</Badge>
                )
              }
            >
              {isFallback && (
                <div className="mb-3 flex flex-col gap-2 rounded-md bg-warning-bg p-3 text-warning">
                  <span className="body-6">
                    {provider.fallbackReason} ·{" "}
                    {formatDateTime(provider.fallbackSince)}부터
                    {provider.fallbackUntil
                      ? ` · ${formatDateTime(provider.fallbackUntil)}에 저절로 메인으로 돌아갑니다`
                      : " · 충전 · 교체 뒤 메인 복귀를 누르거나 5분마다 자동 확인을 기다립니다"}
                  </span>
                  {canWrite && (
                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleRestore(provider.provider)}
                      >
                        메인 복귀
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {provider.slots.map((slot) => renderSlot(provider, slot))}
            </Card>
          );
        })}
      </div>

      <Card
        title="AI 서버 반영 상태"
        description="각 AI 서버가 지금 들고 있는 키(끝 4자리)입니다."
      >
        {data.instances.length === 0 ? (
          <span className="body-6 text-font-2">
            알림을 보낸 AI 서버가 없습니다.
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {data.instances.map((instance) => (
              <div
                key={instance.instanceId}
                className="flex flex-wrap items-center gap-2 body-6"
              >
                <span className="font-semibold">{instance.instanceId}</span>
                <Badge
                  tone={
                    instance.upToDate && !instance.error ? "success" : "warning"
                  }
                >
                  {instance.error
                    ? "읽기 실패"
                    : instance.upToDate
                      ? "반영됨"
                      : "반영 전"}
                </Badge>
                <span className="text-font-2">
                  {formatDateTime(instance.loadedAt)}
                </span>
                <span className="font-mono text-font-2">
                  {Object.entries(instance.maskedKeys)
                    .map(([slot, masked]) => `${slot} ${masked}`)
                    .join(" · ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AiKeySaveModal
        key={target ? slotKey(target.provider, target.slot) : "closed"}
        target={target}
        isSubmitting={saveMutation.isPending}
        onClose={() => setTarget(null)}
        onSubmit={handleSave}
      />
    </div>
  );
};

export default AiKeyManager;
