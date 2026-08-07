"use client";

import { useState } from "react";
import { useCreditPolicyListQuery } from "@/api/billing/getCreditPolicyList";
import { useCreditPolicyMutation } from "@/api/billing/mutateCreditPolicy";
import { Check, Close, Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showAppToast } from "@/lib/toast";
import { cn, formatCredit } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { CreditPolicy, CreditPolicyKey } from "@/type/billing";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import Switch from "@/components/ui/Switch";
import Table, {
  TableCellStack,
  type TableColumn,
} from "@/components/ui/Table";

/** 지급은 초록, 차감은 빨강으로 구분해 부호를 눈으로 먼저 읽게 한다. */
const formatPolicyAmount = (amount: number) =>
  `${amount > 0 ? "+" : ""}${formatCredit(amount)}`;

const CreditPolicyManager = () => {
  const { data, isLoading } = useCreditPolicyListQuery();
  const { updateMutation } = useCreditPolicyMutation();

  // 인라인 수정 중인 정책만 draft를 들고, 나머지는 서버 값을 그대로 쓴다.
  const [editingKey, setEditingKey] = useState<CreditPolicyKey | null>(null);
  const [amountDraft, setAmountDraft] = useState("");

  const policies = data ?? [];

  const handleStartEdit = (policy: CreditPolicy) => {
    setEditingKey(policy.policyKey);
    setAmountDraft(String(policy.amount));
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setAmountDraft("");
  };

  const handleSaveAmount = (policy: CreditPolicy) => {
    const nextAmount = Number(amountDraft);

    if (!amountDraft.trim() || !Number.isInteger(nextAmount)) {
      showAppToast("warning", "크레딧은 정수로 입력해 주세요.");
      return;
    }

    if (nextAmount === 0) {
      showAppToast("warning", "0은 입력할 수 없습니다. 정책을 끄려면 비활성화해 주세요.");
      return;
    }

    if (nextAmount === policy.amount) {
      handleCancelEdit();
      return;
    }

    openConfirm({
      title: "크레딧 정책을 변경할까요?",
      description: `'${policy.label}' 정책 금액을 ${formatPolicyAmount(policy.amount)} → ${formatPolicyAmount(nextAmount)}로 변경합니다.`,
      warning: "변경 즉시 모든 유저에게 새 금액이 적용됩니다.",
      confirmText: "변경",
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          policyKey: policy.policyKey,
          values: { amount: nextAmount, isEnabled: policy.isEnabled },
        });

        handleCancelEdit();
      },
    });
  };

  const handleToggleEnabled = (policy: CreditPolicy, isEnabled: boolean) => {
    openConfirm({
      title: isEnabled ? "정책을 활성화할까요?" : "정책을 비활성화할까요?",
      description: isEnabled
        ? `'${policy.label}' 정책이 다시 동작하며 ${formatPolicyAmount(policy.amount)}가 적용됩니다.`
        : `'${policy.label}' 정책이 즉시 중단되어 크레딧이 지급·차감되지 않습니다.`,
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
        <TableCellStack primary={policy.label} secondary={policy.policyKey} />
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
            {formatPolicyAmount(policy.amount)}
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
            disabled={updateMutation.isPending}
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
        <Badge tone="neutral">{policy.updatedBy}</Badge>
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
              onClick={() => handleSaveAmount(policy)}
            />
            <IconButton
              label="취소"
              icon={<Close size={16} />}
              onClick={handleCancelEdit}
            />
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <IconButton
              label="금액 수정"
              icon={<Edit size={16} />}
              onClick={() => handleStartEdit(policy)}
            />
          </div>
        ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="부호 규칙">
        지급 정책은 <b className="text-success">양수</b>, 차감 정책은{" "}
        <b className="text-danger">음수</b>로 입력합니다. 정책을 바꾸면 확인
        단계를 거친 뒤 모든 유저에게 즉시 적용됩니다.
      </Alert>

      <Card
        title={`크레딧 정책 ${policies.length}건`}
        description="정책 키별 지급·차감 금액과 활성 여부를 관리합니다."
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
