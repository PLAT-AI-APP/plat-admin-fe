"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useServerServicesQuery } from "@/api/ops/getServerServices";
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
import Table, { type TableColumn } from "@/components/ui/Table";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import { getServiceLabel } from "../../server/_constants/serverStatus";
import SecretRestartPanel from "./SecretRestartPanel";
import SecretSaveModal, { type SecretSaveInput } from "./SecretSaveModal";
import { findRestartingApps, findStaleInstances } from "./restartStatus";

const EXPIRY_ALERT_DAYS = 7;

/** AWS 주체 ARN 에서 사람이 읽을 이름만. user/plat-admin → plat-admin, assumed-role/역할/세션 → 역할/세션. */
const principalName = (arn: string | null) => {
  if (!arn) return "";
  const resource = arn.slice(arn.lastIndexOf(":") + 1);
  return resource.replace(/^(user|assumed-role|role)\//, "");
};

const ExpiryCell = ({ expiresOn }: { expiresOn: string | null }) => {
  if (!expiresOn) return <span className="text-font-disabled">-</span>;
  const days = daysLeftKst(expiresOn);
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-font-1">{expiresOn}</span>
      {days < 0 && <Badge tone="danger">{-days}일 지남</Badge>}
      {days >= 0 && days <= EXPIRY_ALERT_DAYS && (
        <Badge tone="warning">D-{days}</Badge>
      )}
    </div>
  );
};

/**
 * 시크릿 목록. 값은 서버도 읽지 않는다 — 저장소의 버전 · 마지막 변경과 관리자 화면에서 넣은 긴 값의 끝 4자리만 보인다.
 * 바꾼 값은 앱이 기동할 때 읽으므로, 마지막 변경보다 먼저 뜬 서버를 찾아 그 자리에서 재시작하게 한다.
 */
const SecretManager = () => {
  const canWrite = useHasPermission("server:write");
  const { data, isLoading, isError, refetch } = useSecretsQuery();
  const { data: services } = useServerServicesQuery();
  const { saveMutation, restoreMutation } = useSecretMutation();
  const [target, setTarget] = useState<SecretItem | null>(null);
  const [group, setGroup] = useState<string>("all");

  const secrets = useMemo(() => data?.secrets ?? [], [data]);
  const staleInstances = useMemo(
    () => (services ? findStaleInstances(secrets, services) : []),
    [secrets, services],
  );
  const restartingApps = useMemo(
    () => (services ? findRestartingApps(services) : []),
    [services],
  );
  const staleNames = new Set(
    staleInstances.flatMap((stale) =>
      stale.secrets.map((secret) => secret.name),
    ),
  );

  /* 서버가 주는 순서가 그룹 순서다. 같은 그룹끼리 붙어 온다. */
  const groups = secrets.reduce<{ value: string; label: string }[]>(
    (acc, secret) =>
      acc.some((item) => item.value === secret.group)
        ? acc
        : [...acc, { value: secret.group, label: secret.groupLabel }],
    [],
  );
  const tabs: TabItem<string>[] = [
    { label: "전체", value: "all", count: secrets.length },
    ...groups.map(({ value, label }) => ({
      label,
      value,
      count: secrets.filter((secret) => secret.group === value).length,
    })),
  ];
  const rows =
    group === "all"
      ? secrets
      : secrets.filter((secret) => secret.group === group);

  const editable = canWrite && !data?.readOnly;
  const missing = secrets.filter((secret) => !secret.registered);

  // 저장소 목록(DescribeParameters)은 방금 쓴 버전을 몇 초 늦게 보여 준다. 잠시 뒤 한 번 더 읽어 맞춘다.
  const refetchSoon = () => window.setTimeout(() => void refetch(), 4_000);

  const handleSave = (input: SecretSaveInput) => {
    if (!target) return;
    const { name, restartApps } = target;
    saveMutation.mutate(
      { name, ...input },
      {
        onSuccess: () => {
          setTarget(null);
          refetchSoon();
          showAppToast(
            "success",
            input.secretValue !== null
              ? `저장했습니다. ${restartApps.map(getServiceLabel).join(" · ")}를 재시작하면 반영됩니다.`
              : "저장했습니다.",
          );
        },
      },
    );
  };

  const handleRestore = (secret: SecretItem) =>
    openConfirm({
      title: `'${secret.label}'을(를) 이전 값으로 되돌릴까요?`,
      description: `v${(secret.version ?? 1) - 1}의 값을 새 버전으로 다시 씁니다. 한 번 더 누르면 지금 값으로 돌아갑니다.`,
      warning: `${secret.restartApps.map(getServiceLabel).join(" · ")}를 재시작해야 반영됩니다.`,
      confirmText: "되돌리기",
      tone: "danger",
      onConfirm: () =>
        restoreMutation.mutateAsync(secret.name).then(() => {
          refetchSoon();
          showAppToast("success", "되돌렸습니다. 재시작 안내를 확인하세요.");
        }),
    });

  const columns: TableColumn<SecretItem>[] = [
    ...(group === "all"
      ? [
          {
            key: "group",
            header: "분류",
            width: "110px",
            render: (row: SecretItem) => (
              <Badge tone="neutral">{row.groupLabel}</Badge>
            ),
          },
        ]
      : []),
    {
      key: "name",
      header: "시크릿",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-font-1">{row.label}</span>
          <code className="body-6 text-font-2">
            {row.name}
            {row.valueHint && ` · ${row.valueHint}`}
          </code>
          {row.memo && <span className="body-6 text-font-2">{row.memo}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "상태",
      width: "210px",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {/* 새면 돈·데이터·전 계정이 위험한 것만 표시한다. 나머지까지 달면 배지가 소음이 된다. */}
          {row.grade === "CRITICAL" && (
            <Badge tone="danger">{SECRET_GRADE_LABEL[row.grade]}</Badge>
          )}
          {row.lockedReason && <Badge tone="neutral">잠금</Badge>}
          {!row.registered && <Badge tone="danger">저장소에 없음</Badge>}
          {staleNames.has(row.name) && (
            <Badge tone="warning">재시작 대기</Badge>
          )}
        </div>
      ),
    },
    {
      key: "modified",
      header: "마지막 변경",
      width: "180px",
      render: (row) =>
        row.registered ? (
          <div className="flex flex-col">
            <span className="text-font-1">
              v{row.version} · {formatDateTime(row.lastModifiedAt)}
            </span>
            <span className="body-6 text-font-2">
              {row.valueUpdatedBy
                ? `관리자 화면 · ${row.valueUpdatedBy}`
                : principalName(row.lastModifiedBy)}
            </span>
          </div>
        ) : (
          <span className="text-font-disabled">저장소에 없음</span>
        ),
    },
    {
      key: "expiresOn",
      header: "만료",
      width: "110px",
      render: (row) => <ExpiryCell expiresOn={row.expiresOn} />,
    },
    {
      key: "actions",
      header: "",
      width: "170px",
      align: "right",
      render: (row) =>
        editable ? (
          <div className="flex justify-end gap-1.5">
            {!row.lockedReason && (row.version ?? 0) > 1 && (
              <Button
                size="sm"
                variant="ghost"
                disabled={restoreMutation.isPending}
                onClick={() => handleRestore(row)}
              >
                되돌리기
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setTarget(row)}
            >
              {row.lockedReason ? "정보 수정" : "변경"}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {isError && (
        <Alert tone="danger" title="시크릿 목록을 불러오지 못했습니다.">
          저장소(AWS Parameter Store)에 닿지 못했을 수 있습니다. 잠시 후 다시
          시도해 주세요.
        </Alert>
      )}
      {data?.readOnly && (
        <Alert tone="info" title="이 환경에서는 바꿀 수 없습니다.">
          로컬은 읽기만 합니다. 바꾸려면 dev 관리자 화면을 쓰세요.
        </Alert>
      )}
      {data && !data.readOnly && missing.length > 0 && (
        <Alert tone="danger" title="저장소에 없는 시크릿이 있습니다.">
          {missing.map((secret) => secret.label).join(", ")} — 이대로 다시
          띄우면 서버가 뜨지 않습니다. 변경을 눌러 값을 넣으세요.
        </Alert>
      )}
      {data && !data.readOnly && (
        <SecretRestartPanel
          staleInstances={staleInstances}
          restartingApps={restartingApps}
          canRestart={canWrite}
        />
      )}

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <div className="flex flex-col">
            <p className="body-4 font-semibold text-font-1">시크릿</p>
            <p className="body-6 text-font-2">
              {data?.path ?? "AWS Parameter Store"} · 값은 보이지 않습니다. AI
              제공사 키는{" "}
              <Link href="/ai/keys" className="underline">
                AI 운영 › API 키
              </Link>
              에서 관리합니다.
            </p>
          </div>
        </div>

        {!isLoading && secrets.length > 0 && (
          <Tabs
            items={tabs}
            value={group}
            onChange={setGroup}
            className="px-5"
          />
        )}

        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.name}
          isLoading={isLoading}
          skeletonRows={8}
          emptyTitle="시크릿이 없습니다"
        />
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
