"use client";

import { useState } from "react";
import { useCreditPolicyListQuery } from "@/api/billing/getCreditPolicyList";
import { useCreditPolicyMutation } from "@/api/billing/mutateCreditPolicy";
import { useCan } from "@/hooks/useCan";
import { Check, Close, Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { cn, formatAdmin, formatSignedCredit } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type {
  CreditExpiryUnit,
  CreditPolicy,
  CreditPolicyKey,
} from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import Select, { type SelectOption } from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import TableCellStack from "@/components/ui/TableCellStack";

const EXPIRY_UNIT_OPTIONS: SelectOption<CreditExpiryUnit>[] = [
  { label: "일", value: "DAY" },
  { label: "년", value: "YEAR" },
];

/** 서버 상한과 같다(10년). 0을 하나 더 붙인 실수를 저장 전에 막는다. */
const EXPIRY_MAX: Record<CreditExpiryUnit, number> = { DAY: 3650, YEAR: 10 };

const formatExpiry = (value: number, unit: CreditExpiryUnit) =>
  `${value.toLocaleString()}${unit === "YEAR" ? "년" : "일"}`;

const CreditPolicyManager = () => {
  const { data, isLoading } = useCreditPolicyListQuery();
  const { updateMutation } = useCreditPolicyMutation();
  const canWrite = useCan("creditPolicy:write");

  // 인라인 수정 중인 정책만 draft를 들고, 나머지는 서버 값을 그대로 쓴다.
  const [editingKey, setEditingKey] = useState<CreditPolicyKey | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [expiryValueDraft, setExpiryValueDraft] = useState("");
  const [expiryUnitDraft, setExpiryUnitDraft] =
    useState<CreditExpiryUnit>("DAY");

  const policies = data ?? [];

  const handleStartEdit = (policy: CreditPolicy) => {
    setEditingKey(policy.policyKey);
    setAmountDraft(String(policy.amount));
    setExpiryValueDraft(String(policy.expiryValue));
    setExpiryUnitDraft(policy.expiryUnit);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setAmountDraft("");
    setExpiryValueDraft("");
  };

  const handleSavePolicy = (policy: CreditPolicy) => {
    const nextAmount = Number(amountDraft);
    const nextExpiryValue = Number(expiryValueDraft);

    if (!amountDraft.trim() || !Number.isInteger(nextAmount)) {
      showAppToast("warning", "노트는 정수로 입력해 주세요.");
      return;
    }

    if (nextAmount === 0) {
      showAppToast("warning", "0은 입력할 수 없습니다. 정책을 끄려면 비활성화해 주세요.");
      return;
    }

    const expiryMax = EXPIRY_MAX[expiryUnitDraft];
    if (
      !expiryValueDraft.trim() ||
      !Number.isInteger(nextExpiryValue) ||
      nextExpiryValue < 1 ||
      nextExpiryValue > expiryMax
    ) {
      showAppToast(
        "warning",
        `만료 기간은 1~${expiryMax.toLocaleString()}${expiryUnitDraft === "YEAR" ? "년" : "일"} 사이 정수로 입력해 주세요.`,
      );
      return;
    }

    const amountChanged = nextAmount !== policy.amount;
    const expiryChanged =
      nextExpiryValue !== policy.expiryValue ||
      expiryUnitDraft !== policy.expiryUnit;

    if (!amountChanged && !expiryChanged) {
      handleCancelEdit();
      return;
    }

    const changes = [
      amountChanged &&
        `금액을 ${formatSignedCredit(policy.amount)} → ${formatSignedCredit(nextAmount)}`,
      expiryChanged &&
        `만료 기간을 ${formatExpiry(policy.expiryValue, policy.expiryUnit)} → ${formatExpiry(nextExpiryValue, expiryUnitDraft)}`,
    ].filter(Boolean);

    openConfirm({
      title: "노트 정책을 변경할까요?",
      description: `'${policy.label}' 정책 ${changes.join(", ")}로 변경합니다.`,
      warning: expiryChanged
        ? "변경 즉시 모든 유저에게 적용됩니다. 만료 기간은 이후 지급분부터 적용되고, 이미 지급한 노트의 만료일은 바뀌지 않습니다."
        : "변경 즉시 모든 유저에게 새 금액이 적용됩니다.",
      confirmText: "변경",
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          policyKey: policy.policyKey,
          values: {
            amount: nextAmount,
            isEnabled: policy.isEnabled,
            expiryValue: nextExpiryValue,
            expiryUnit: expiryUnitDraft,
          },
        });

        handleCancelEdit();
      },
    });
  };

  const handleToggleEnabled = (policy: CreditPolicy, isEnabled: boolean) => {
    openConfirm({
      title: isEnabled ? "정책을 활성화할까요?" : "정책을 비활성화할까요?",
      description: isEnabled
        ? `'${policy.label}' 정책이 다시 동작하며 ${formatSignedCredit(policy.amount)}가 적용됩니다.`
        : `'${policy.label}' 정책이 즉시 중단되어 노트가 지급·차감되지 않습니다.`,
      confirmText: isEnabled ? "활성화" : "비활성화",
      tone: isEnabled ? "default" : "danger",
      onConfirm: () =>
        updateMutation.mutateAsync({
          policyKey: policy.policyKey,
          values: { amount: policy.amount, isEnabled },
        }),
    });
  };

  const columns: TableColumn<CreditPolicy>[] = [
    {
      key: "label",
      header: "정책",
      width: "220px",
      render: (policy) => (
        <div className="flex flex-col items-start gap-1">
          <TableCellStack primary={policy.label} secondary={policy.policyKey} />
          {/* 정책 표만 있고 지급 코드가 없는 항목. 켜 두어도 지급되지 않는다는 것을 한눈에 보인다. */}
          {!policy.applied && (
            <Badge tone="warning" title="지급 코드가 아직 없어 켜도 지급되지 않습니다.">
              미연동
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "설명",
      render: (policy) => (
        <span className="text-font-2">{policy.description}</span>
      ),
    },
    {
      key: "amount",
      header: "금액",
      width: "180px",
      align: "right",
      numeric: true,
      render: (policy) =>
        editingKey === policy.policyKey ? (
          <Input
            value={amountDraft}
            onChange={(event) => setAmountDraft(event.target.value)}
            type="number"
            step={1}
            aria-label={`${policy.label} 금액`}
            className="text-right tabular-nums"
            inputBoxClassName="h-9"
          />
        ) : (
          <span
            className={cn(
              "font-semibold",
              policy.amount > 0 ? "text-success" : "text-danger",
            )}
          >
            {formatSignedCredit(policy.amount)}
          </span>
        ),
    },
    {
      key: "expiry",
      header: "만료 기간",
      width: "170px",
      align: "right",
      numeric: true,
      render: (policy) =>
        editingKey === policy.policyKey ? (
          <div className="flex items-center justify-end gap-1">
            <Input
              value={expiryValueDraft}
              onChange={(event) => setExpiryValueDraft(event.target.value)}
              type="number"
              min={1}
              max={EXPIRY_MAX[expiryUnitDraft]}
              step={1}
              aria-label={`${policy.label} 만료 기간`}
              className="text-right tabular-nums"
              inputBoxClassName="h-9 w-20"
            />
            <Select
              value={expiryUnitDraft}
              onChange={(event) =>
                setExpiryUnitDraft(event.target.value as CreditExpiryUnit)
              }
              options={EXPIRY_UNIT_OPTIONS}
              aria-label={`${policy.label} 만료 기간 단위`}
              selectBoxClassName="h-9 w-20 shrink-0"
            />
          </div>
        ) : (
          <span className="text-font-2">
            {formatExpiry(policy.expiryValue, policy.expiryUnit)}
          </span>
        ),
    },
    {
      key: "isEnabled",
      header: "활성",
      width: "100px",
      align: "center",
      render: (policy) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            label={`${policy.label} 활성 여부`}
            checked={policy.isEnabled}
            disabled={!canWrite || updateMutation.isPending}
            onChange={(checked) => handleToggleEnabled(policy, checked)}
          />
        </div>
      ),
    },
    {
      key: "updatedBy",
      header: "수정자",
      width: "110px",
      render: (policy) => (
        <Badge tone="neutral">
          {formatAdmin(policy.updatedBy, policy.updatedById)}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      header: "수정일",
      width: "150px",
      numeric: true,
      render: (policy) => (
        <span className="text-font-2">{formatDateTime(policy.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "88px",
      align: "right",
      render: (policy) =>
        editingKey === policy.policyKey ? (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              label="저장"
              icon={<Check size={16} />}
              onClick={() => handleSavePolicy(policy)}
            />
            <IconButton
              label="취소"
              icon={<Close size={16} />}
              onClick={handleCancelEdit}
            />
          </div>
        ) : (
          canWrite && (
          <div className="flex items-center justify-end">
            <IconButton
              label="정책 수정"
              icon={<Edit size={16} />}
              onClick={() => handleStartEdit(policy)}
            />
          </div>
          )
        ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="금액이 고정된 정책만 관리합니다.">
        지급 정책은 <b className="text-success">양수</b>, 차감 정책은{" "}
        <b className="text-danger">음수</b>로 입력하며, 정책을 바꾸면 확인 단계를
        거친 뒤 모든 유저에게 즉시 적용됩니다. 채팅 메시지·이미지 생성처럼 모델과
        옵션(이미지 크기·화질 등)에 따라 차감액이 달라지는 사용 요금은 고정할 수
        없어 <b>채팅 요금</b> · <b>모델별 요금</b> 탭에서 관리합니다.
      </Alert>

      <Alert tone="warning" title="'미연동' 정책은 아직 지급되지 않습니다.">
        지금 실제로 지급되는 정책은 <b>가입 축하 노트</b>뿐입니다. 나머지는
        금액과 활성 여부만 저장되고 지급 기능이 붙지 않아, 켜 두어도 유저가 받지
        않습니다. 이벤트로 공지하기 전에 개발 연동을 먼저 확인해 주세요.
      </Alert>

      <Card
        title={`노트 정책 ${policies.length}건`}
        description="정책 키별 지급 금액·만료 기간과 활성 여부를 관리합니다."
        noPadding
      >
        <Table
          columns={columns}
          rows={policies}
          getRowKey={(policy) => policy.policyKey}
          isLoading={isLoading}
          skeletonRows={6}
          emptyTitle="등록된 정책이 없습니다."
          emptyDescription="정책 키는 서버 배포로 추가됩니다. 배포 상태를 확인해 주세요."
        />
      </Card>
    </>
  );
};

export default CreditPolicyManager;
